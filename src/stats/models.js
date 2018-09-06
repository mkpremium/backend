import debug from 'debug';
import _isNil from 'lodash/isNil';
import {CouchbaseModel} from '../db/model';
import t from './types';
import {addBetweenQueryToBuilder, addDateQueryToBuilder} from '../lib/query/helpers';
import {queryDateFormat, utc} from '../lib/date';

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

const GetStatsFilterBase = t.struct(
  {
    operatorId: t.maybe(t.String)
  },
  {
    name: 'GetStatsFilter'
  }
);

const GetStatsFilterRange = GetStatsFilterBase.extend(
  {
    dateBetween: t.String
  }
);

const GetStatsFilterFixed = GetStatsFilterBase.extend(
  {
    range: t.enums.of([
      'lastYear',
      'lastMonth',
      'yesterday',
      'today',
      'month',
      'year'
    ])
  },
  {
    defaultProps: {
      range: 'today'
    }
  }
);

const GetStatsFilter = t.union([
  GetStatsFilterRange,
  GetStatsFilterFixed
]);

GetStatsFilter.dispatch = function(x) {
  if (typeof x.dateBetween !== 'undefined') {
    return GetStatsFilterRange;
  }

  return GetStatsFilterFixed;
};

function getDateBetweenByFixed(value) {
  const today = utc();
  const yesterday = today.clone().subtract(1, 'days');
  const lastMonth = today.clone().subtract(1, 'months');
  const lastYear = today.clone().subtract(1, 'year');
  switch (value) {
    case 'lastYear':
      return [
        queryDateFormat(lastYear.clone().startOf('year')),
        queryDateFormat(lastYear.clone().endOf('year'))].join(',');
    case 'year':
      return [
        queryDateFormat(today.clone().startOf('year')),
        queryDateFormat(today.clone().endOf('year'))].join(',');
    case 'month':
      return [
        queryDateFormat(today.clone().startOf('month')),
        queryDateFormat(today.clone().endOf('month'))].join(',');
    case 'lastMonth':
      return [
        queryDateFormat(lastMonth.clone().startOf('month')),
        queryDateFormat(lastMonth.clone().endOf('month'))].join(',');
    case 'yesterday':
      return [queryDateFormat(yesterday), queryDateFormat(yesterday)].join(',');
    case 'today':
    default:
      return [queryDateFormat(today), queryDateFormat(today)].join(',');
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

  async getStats(params) {
    const filter = GetStatsFilter(params);
    if (GetStatsFilterFixed.is(filter)) {
      return this.getStatsFixed(filter.range, filter.operatorId);
    } else {
      return this.getStatsByDateRange(filter.dateRange, filter.operatorId);
    }
  }

  async getStatsFixed(value, operatorId) {
    const dateBetween = getDateBetweenByFixed(value);
    return this.getStatsByDateRange(dateBetween, operatorId);
  }

  async getStatsByDateRange(dateRange, operatorId) {
    const qb = this.getQueryBuilder('count');
    addBetweenQueryToBuilder(qb, 'createdAt', dateRange);

    if (!_isNil(operatorId)) {
      qb.where('operatorId = ?', operatorId);
    }

    qb
      .field('operatorId')
      .field('action')
      .group('operatorId')
      .group('action');

    return this.query(qb);
  }
}

export class OperatorPerformance extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.OperatorPerformace;
  }

  calculateForOperator(operatorId) {

  }
}
