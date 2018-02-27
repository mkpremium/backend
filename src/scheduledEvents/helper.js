import {utc} from '../../lib/date';

export const addDateQueryToBuilder = (qb, queryParam, dbParam) => {
  const m = utc(queryParam);
  qb.where(`${dbParam} >= ?`, m.clone().startOf('day').toDate());
};

export const addBetweenQueryToBuilder = (qb, queryParam, dbParam) => {
  const [start, end] = queryParam.split(',').map(d => d ? utc(d) : d);
  if (start) {
    qb.where(`${dbParam} <= ?`, start.startOf('day').toDate());
  }
  if (end) {
    qb.where(`${dbParam} <= ?`, end.endOf('day').toDate());
  }
};
