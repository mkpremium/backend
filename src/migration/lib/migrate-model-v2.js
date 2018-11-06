import models from '../models';
import debug from 'debug';
import os from 'os';

import couchbase from '../../db/couchbase';
import csv from 'csvtojson';
import {defer} from '../../lib/promise-util';

const debugMigrate = debug('app:migration:migrate');

const defaultOptions = {
  delimiter: ';',
  fork: true,
  workerNum: Math.max(os.cpus().length - 1, 1) // ensure at least one worker
};

const noOp = () => {
};

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

export class MigrateModelV2 {
  constructor(name, filename, app = {}, opt) {
    this.app = app;
    this.bucket = null;
    this.name = name;
    this.filename = filename;
    this.csvOpt = opt;
    this.processFunc = this.processFunc.bind(this);
  }

  async processFunc(data, row) {
    try {
      switch (this.name) {
        case 'owner':
          const {person, owner} = models[this.name](data);
          await this.pushToDatabase(person);
          await this.pushToDatabase(owner);
          break;
        default:
          await this.pushToDatabase(models[this.name](data));
      }
    } catch (e) {
      console.error(e.message, 'at', row, data);
      throw e;
    }
  }

  async importFileToModel() {
    debugMigrate('importing', this.filename, 'into', this.name);
    return csvToJSON(this.filename, this.processFunc, this.csvOpt);
  }

  async pushToDatabase(processedData) {
    return this.bucket.upsertToDb(processedData.id, processedData);
  }

  async run() {
    if (typeof models[this.name] !== 'function') {
      throw new Error(`Model ${this.name}.migrateFromCsv() not found nor correctly exported`);
    }

    this.bucket = this.app.locals
      ? this.app.locals.bucket
      : await couchbase(this.app);

    await this.importFileToModel();
  }
}
