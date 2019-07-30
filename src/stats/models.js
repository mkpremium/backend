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

  static async registerAction(operatorId, action, filters = {}) {
    statDebug('registerAction', action, operatorId);
    const operatorStats = new OperatorStats();
    return operatorStats.save(Object.assign({operatorId, action}, filters));
  }
}

const GetStatsFilterBase = t.struct(
  {
    operatorId: t.maybe(t.String),
    view: t.String,
    city: t.maybe(t.String),
    province: t.maybe(t.string)
  },
  {
    name: 'GetStatsFilter',
    defaultProps: {
      view: 'total'
    }
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
        queryDateFormat(today.clone().endOf('day'))].join(',');
    case 'month':
      return [
        queryDateFormat(today.clone().subtract(offset, 'days').startOf('month')),
        queryDateFormat(today.clone().endOf('day'))].join(',');
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
      ? await this.getStatsFixed(filter)
      : await this.getStatsByDateRange(filter.dateBetween, filter);

    switch (filter.view) {
      case 'day':
        return _.mapValues(_groupBy(results, 'operatorId'), operatorStats);
      case 'total':
      default:
        return _.chain(results).groupBy('operatorId').mapValues(calculateCounters).value();
    }
  }

  async getStatsFixed(filter) {
    const dateBetween = getDateBetweenByFixed(filter.range);
    return this.getStatsByDateRange(dateBetween, filter);
  }

  async getStatsByDateRange(dateRange, filter) {
    const qb = this.getQueryBuilder('count');
    addBetweenQueryToBuilder(qb, 'createdAt', dateRange);

    if (!_isNil(filter.operatorId)) {
      qb.where('operatorId = ?', filter.operatorId);
    }

    if (!_isNil(filter.province)) {
      qb.where('province = ?', filter.province);
    }

    switch (filter.view) {
      case 'day':
        qb
          .field('operatorId')
          .field('action')
          .field('DATE_FORMAT_STR(createdAt, "1111-11-11") as createdAtStr')
          .field('createdAt')
          .group('operatorId')
          .group('action')
          .group('createdAt')
          .where('action IS NOT MISSING')
          .where('operatorId IS NOT MISSING')
          .where('createdAt IS NOT MISSING')
          .order('operatorId').order('createdAt');
        break;
      case 'total':
      default:
        qb
          .field('operatorId')
          .field('action')
          .group('operatorId')
          .group('action')
          .where('action IS NOT MISSING')
          .where('operatorId IS NOT MISSING')
          .order('operatorId');
        break;
    }

    return this.query(qb);
  }

  async getProvinceStats(params) {
    const filter = GetStatsFilter(params);
    const results = GetStatsFilterFixed.is(filter)
      ? await this.getProvinceStatsFixed(filter)
      : await this.getProvinceStatsByDateRange(filter.dateBetween, filter);

    switch (filter.view) {
      case 'day':
        return _.mapValues(_groupBy(results, 'province'), operatorStats);
      case 'total':
      default:
        return _.chain(results).groupBy('province').mapValues(calculateCounters).value();
    }
  }

  async getProvinceStatsFixed(filter) {
    const dateBetween = getDateBetweenByFixed(filter.range);
    return this.getProvinceStatsByDateRange(dateBetween, filter);
  }

  async getProvinceStatsByDateRange(dateRange, filter) {
    const qb = this.getQueryBuilder('count');
    addBetweenQueryToBuilder(qb, 'createdAt', dateRange);

    if (!_isNil(filter.operatorId)) {
      qb.where('operatorId = ?', filter.operatorId);
    }

    if (!_isNil(filter.province)) {
      qb.where('province = ?', filter.province);
    }

    switch (filter.view) {
      case 'day':
        qb
          .field('province')
          .field('action')
          .field('DATE_FORMAT_STR(createdAt, "1111-11-11") as createdAtStr')
          .field('createdAt')
          .group('province')
          .group('action')
          .group('createdAt')
          .where('province IS NOT MISSING')
          .where('action IS NOT MISSING')
          .where('createdAt IS NOT MISSING')
          .order('province').order('createdAt');
        break;
      case 'total':
      default:
        qb
          .field('province')
          .field('action')
          .group('province')
          .group('action')
          .order('province')
          .where('province IS NOT MISSING')
          .where('action IS NOT MISSING');
        break;
    }

    return this.query(qb);
  }

  async getPerformanceByDateRange(dateRange, filter) {
    const results = await this.getStatsByDateRange(getDateRangeOffset(dateRange), filter);
    return [dateRange, results];
  }

  async getPerformanceByFixed(filter) {
    const dateRange = getDateBetweenByFixed(filter.range);
    return this.getPerformanceByDateRange(dateRange, filter);
  }

  async getPerformance(params) {
    const filter = GetStatsFilter(params);
    const [dateRange, results] = GetStatsFilterFixed.is(filter)
      ? await this.getPerformanceByFixed(filter)
      : await this.getPerformanceByDateRange(filter.dateBetween, filter);
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

function calculateCounters(counters) {
  const mappedCounters = {};
  Object.values(OperatorActions).map(statKey => {
    let total = 0;
    _.filter(counters, {action: statKey}).forEach(({count}) => {
      total += count;
    });

    mappedCounters[statKey] = total;
  });

  return mappedCounters;
}

function operatorStats(operatorStats) {
  return _.chain(operatorStats)
    .groupBy('createdAtStr')
    .mapValues(calculateCounters)
    .value();
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
