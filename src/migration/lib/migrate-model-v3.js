import debug from 'debug';

import couchbase from '../../db/couchbase';
import csv from 'csvtojson';
import {defer} from '../../lib/promise-util';

const debugMigrate = debug('app:migration:migrate');

const defaultOptions = {
  delimiter: ';'
};

const noOp = () => {};

export async function csvToJSON(filepath, processFunc = noOp, options = defaultOptions) {
  const {promise, resolve, reject} = defer();
  csv(options)
    .fromFile(filepath)
    .subscribe(processFunc)
    .on('done', function(err) {
      err ? reject(err) : resolve();
    });

  return promise;
}

export class MigrateModelV3 {
  constructor(filename, bucket = null, opt) {
    this.bucket = bucket;
    this.filename = filename;
    this.csvOpt = opt;
    this.processFunc = this.processFunc.bind(this);
  }

  // noinspection JSMethodCanBeStatic
  parseToData() {
    throw new Error('Extend this class and add a custom parseToData method');
  }

  async processFunc(data, row) {
    try {
      const parsedData = await Promise.resolve(this.parseToData(data, row));
      return this.pushToDatabase(parsedData);
    } catch (e) {
      console.error(e.message, 'at', row, data);
      throw e;
    }
  }

  async importFileToModel() {
    debugMigrate('importing', this.filename);
    return csvToJSON(this.filename, this.processFunc, this.csvOpt);
  }

  async pushToDatabase(processedData) {
    // if nothing returned by parseToData, do nothing
    if (typeof processedData === 'undefined') {
      return;
    }

    if (typeof processedData.id === 'undefined') {
      throw new Error('processed data should have some .id attached in order to be added into database');
    }

    if (typeof processedData._documentType === 'undefined') {
      throw new Error('processed data should have some ._documentType attached in order to be added into database');
    }

    return this.bucket.upsertToDb(processedData.id, processedData);
  }

  async run() {
    this.bucket = this.bucket || await couchbase();

    return this.importFileToModel();
  }
}
