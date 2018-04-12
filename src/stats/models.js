import debug from 'debug';
import {CouchbaseModel} from '../db/model';
import t from './types';
import {addDateQueryToBuilder} from '../lib/query/helpers';

const statDebug = debug('app:model:stats');

export class OperatorStats extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.OperatorStats;
  }

  static async registerAction(operatorId, action) {
    statDebug('registerAction', action, operatorId);
    const operatorStats = new OperatorStats();
    return operatorStats.save({operatorId, action});
  }
}

export class OperatorStatsRepository extends OperatorStats {
  async getOverAll(date = new Date()) {
    const qb = this.getQueryBuilder('count');
    addDateQueryToBuilder(qb, 'createdAt', date);

    qb
      .field('operatorId')
      .field('action')
      .group('operatorId')
      .group('action');

    return this.query(qb);
  }
}
