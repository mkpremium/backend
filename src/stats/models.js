import {CouchbaseModel} from '../db/model';
import t from './types';

export class OperatorStats extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.OperatorStats;
  }

  static async registerAction(operatorId, action) {
    const operatorStats = new OperatorStats();
    return operatorStats.save({operatorId, action});
  }
}

export class StatsRepository {
  async getOverAll() {

  }
}
