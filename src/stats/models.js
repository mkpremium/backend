import debug from 'debug';
import _isNil from 'lodash/isNil';
import _groupBy from 'lodash/groupBy';
import _ from 'lodash';
import {CouchbaseModel} from '../db/model';
import t, {OperatorActions} from './types';
import {
  addBetweenQueryToBuilder,
  addDateQueryToBuilder,
  rangeStartEnd,
  dateRangeArray,
  splitDateRange
} from '../lib/query/helpers';
import {queryDateFormat, utc} from '../lib/date';
import {operatorPerformance} from '../../config';

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

function getDateBetweenByFixed(value, offset = 0) {
  const today = utc();
  const yesterday = today.clone().subtract(1, 'days');
  const lastMonth = today.clone().subtract(1, 'months');
  const lastYear = today.clone().subtract(1, 'year');
  switch (value) {
    case 'lastYear':
      return [
        queryDateFormat(lastYear.clone().subtract(offset, 'days').startOf('year')),
        queryDateFormat(lastYear.clone().endOf('year'))].join(',');
    case 'year':
      return [
        queryDateFormat(today.clone().subtract(offset, 'days').startOf('year')),
        queryDateFormat(today.clone().endOf('year'))].join(',');
    case 'month':
      return [
        queryDateFormat(today.clone().subtract(offset, 'days').startOf('month')),
        queryDateFormat(today.clone().endOf('month'))].join(',');
    case 'lastMonth':
      return [
        queryDateFormat(lastMonth.clone().subtract(offset, 'days').startOf('month')),
        queryDateFormat(lastMonth.clone().endOf('month'))].join(',');
    case 'yesterday':
      return [
        queryDateFormat(yesterday.clone().subtract(offset, 'days')),
        queryDateFormat(yesterday)].join(',');
    case 'today':
    default:
      return [
        queryDateFormat(today.clone().subtract(offset, 'days')),
        queryDateFormat(today)].join(',');
  }
}

function getDateRangeOffset(dateRange) {
  const [start, end] = splitDateRange(dateRange);
  const startOffset = start.subtract(operatorPerformance.numberOfDayOffset, 'days');
  return [
    queryDateFormat(startOffset),
    queryDateFormat(end)
  ].join(',');
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
    const results = GetStatsFilterFixed.is(filter)
      ? await this.getStatsFixed(filter.range, filter.operatorId)
      : await this.getStatsByDateRange(filter.dateBetween, filter.operatorId);

    return _groupBy(results, 'operatorId');
  }

  async getStatsFixed(value, operatorId) {
    const dateBetween = getDateBetweenByFixed(value);
    return this.getStatsByDateRange(dateBetween, operatorId);
  }

  async getStatsByDateRange(dateRange, operatorId, view = 'total') {
    const qb = this.getQueryBuilder('count');
    addBetweenQueryToBuilder(qb, 'createdAt', dateRange);

    if (!_isNil(operatorId)) {
      qb.where('operatorId = ?', operatorId);
    }

    switch (view) {
      case 'day':
        qb
          .field('operatorId')
          .field('action')
          .field('DATE_FORMAT_STR(createdAt, "1111-11-11") as createdAtStr')
          .field('createdAt')
          .group('operatorId')
          .group('action')
          .group('createdAt')
          .order('operatorId').order('createdAt');
        break;
      case 'total':
      default:
        qb
          .field('operatorId')
          .field('action')
          .group('operatorId')
          .group('action')
          .order('operatorId');
        break;
    }

    return this.query(qb);
  }

  async getPerformanceByDateRange(dateRange, operatorId) {
    const results = await this.getStatsByDateRange(getDateRangeOffset(dateRange), operatorId, 'day');
    return [dateRange, results];
  }

  async getPerformanceByFixed(value, operatorId) {
    const dateRange = getDateBetweenByFixed(value);
    return this.getPerformanceByDateRange(dateRange, operatorId, 'day');
  }

  async getPerformance(params) {
    const filter = GetStatsFilter(params);
    const [dateRange, results] = GetStatsFilterFixed.is(filter)
      ? await this.getPerformanceByFixed(filter.range, filter.operatorId)
      : await this.getPerformanceByDateRange(filter.dateRange, filter.operatorId);
    const groupedResults = _groupBy(filterPerformanceEvents(results), 'operatorId');
    return _.mapValues(groupedResults, operatorCalculation(dateRange));
  }
}

function filterPerformanceEvents(results) {
  return results
    .filter(result => [OperatorActions.MEETING, OperatorActions.VIEW_WORKSHEET].indexOf(result.action) !== -1);
}

function operatorCalculation(dateRange) {
  return (operatorActions) => {
    const dailyCalculations = _.chain(operatorActions)
      .groupBy('createdAtStr')
      .mapValues(dailyCalculation)
      .value();
    const ratios = {};
    dateRangeArray(dateRange).forEach(day => {
      const dayDate = queryDateFormat(day);
      const start = queryDateFormat(day.clone().subtract(operatorPerformance.numberOfDayOffset, 'days'));
      const end = queryDateFormat(day);
      const range = rangeStartEnd(start, end);
      const values = [];
      const valuesKeys = {};
      _.mapValues(dailyCalculations, (dailyCalculation, date) => {
        if (range.contains(utc(date))) {
          values.push(dailyCalculation);
          valuesKeys[date] = dailyCalculation;
        }
      });
      ratios[dayDate] = {
        values: valuesKeys,
        dayRatio: dailyCalculations[dayDate] || 0,
        meanRatio: _.sum(values) / Math.max(1, values.length)
      };
    });
    return ratios;
  };
}

function dailyCalculation(dayActions) {
  const meetings = _.chain(dayActions)
    .filter(['action', OperatorActions.MEETING])
    .sumBy('count')
    .value();
  const views = _.chain(dayActions)
    .filter(['action', OperatorActions.VIEW_WORKSHEET])
    .sumBy('count')
    .value();
  return meetings / Math.max(1, views);
}

export class OperatorPerformance extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.OperatorPerformace;
  }

  calculateForOperator(operatorId) {

  }
}
