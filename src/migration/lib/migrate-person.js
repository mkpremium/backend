import _ from 'lodash';
import t from 'tcomb';
import debug from 'debug';
import Promise from 'bluebird';
import {MigrateModel} from './migrate-model';
import {PersonRepository} from '../../owner/models';
import models from '../models';

const debugMigrate = debug('app:migration:migrate');

export class MigratePersonModel extends MigrateModel {
  constructor(filename, codes, app = {}) {
    super('person', filename, app);
    this.codes = codes;
  }

  processFunc(data, row) {
    try {
      this.migratedData.push(models[this.name](data, this.codes));
    } catch (e) {
      console.error(e.message, 'at', row, data);
      throw e;
    }
  }

  async pushToDatabase(processedData) {
    debugMigrate('importing to db', processedData.length, 'records');
    const repo = new PersonRepository();
    const push = async(migratedRecord) => {
      const [person] = await repo.findByMigratedId(migratedRecord._migrateId);
      if (person) {
        debugMigrate(`person ${migratedRecord._migrateId} was found, updating ${person.id}`);
        const updatedPerson = t.update(person, {$merge: _.omit(migratedRecord, ['id'])});
        return this.bucket.upsertToDb(person.id, updatedPerson);
      } else {
        debugMigrate(`person imported from ${migratedRecord._migrateId}`);
        return this.bucket.upsertToDb(migratedRecord.id, migratedRecord);
      }
    };
    return Promise.map(processedData, push, {concurrency: 10});
  }
}
