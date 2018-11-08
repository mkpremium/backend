import models from '../models';
import {MigrateModelV2} from './migrate-model-v2';

export class MigratePersonModel extends MigrateModelV2 {
  constructor(filename, codes, app = {}) {
    super('person', filename, app);
    this.codes = codes;
  }

  async processFunc(data, row) {
    try {
      return this.pushToDatabase(models[this.name](data, this.codes));
    } catch (e) {
      console.error(e.message, 'at', row, data);
      throw e;
    }
  }
}
