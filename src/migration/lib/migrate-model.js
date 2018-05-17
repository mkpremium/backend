import models from '../models';
import debug from 'debug';
import Promise from 'bluebird';

import {combineDuplicatesDocumentNumber} from '../models/owner';
import couchbase from '../../db/couchbase';
import {csvToJson} from './index';

const debugMigrate = debug('app:migration:migrate');

export class MigrateModel {
  constructor(name, filename, app = {}, opt) {
    this.app = app;
    this.bucket = null;
    this.migratedData = [];
    this.processedData = [];
    this.name = name;
    this.filename = filename;
    this.csvOpt = opt;

    this.postImport = this.postImport.bind(this);
    this.processFunc = this.processFunc.bind(this);
  }

  postImport() {
    switch (this.name) {
      case 'owner':
        this.processedData = combineDuplicatesDocumentNumber(this.migratedData);
        break;
      default:
        this.processedData = this.migratedData;
        break;
    }
    debugMigrate(this.processedData.length, 'after post-processing');
  }

  processFunc(data, row) {
    try {
      switch (this.name) {
        case 'owner':
          const {person, owner} = models[this.name](data);
          this.migratedData.push(person);
          this.migratedData.push(owner);
          break;
        default:
          this.migratedData.push(models[this.name](data));
      }
    } catch (e) {
      console.error(e.message, 'at', row, data);
      throw e;
    }
  }

  async importFileToModel() {
    debugMigrate('importing', this.filename, 'into', this.name);
    await csvToJson(this.filename, this.processFunc, this.csvOpt);
  }

  async pushToDatabase(processedData) {
    debugMigrate('importing to db', processedData.length, 'records');
    const push = migratedRecord => this.bucket.upsertToDb(migratedRecord.id, migratedRecord);
    return Promise.mapSeries(processedData, push);
  }

  async run() {
    if (typeof models[this.name] !== 'function') {
      throw new Error(`Model ${this.name}.migrateFromCsv() not found nor correctly exported`);
    }

    this.bucket = this.app.locals
      ? this.app.locals.bucket
      : await couchbase(this.app);

    await this.importFileToModel();
    this.postImport();
    return this.pushToDatabase(this.processedData);
  }
}
