import {utc} from '../date';

export const addDateQueryToBuilder = (queryBuilder, fieldName, value) => {
  const m = utc(value);
  queryBuilder.where(`${fieldName} <= ?`, m.clone().startOf('day').toDate());
};

export const addBetweenQueryToBuilder = (queryBuilder, fieldName, value) => {
  const [start, end] = value.split(',').map(d => d ? utc(d) : d);
  if (start) {
    queryBuilder.where(`${fieldName} <= ?`, start.startOf('day').toDate());
  }
  if (end) {
    queryBuilder.where(`${fieldName} <= ?`, end.endOf('day').toDate());
  }
};
