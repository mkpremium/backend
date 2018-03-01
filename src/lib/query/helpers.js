import {utc} from '../date';

export const addDateQueryToBuilder = (queryBuilder, fieldName, value) => {
  const m = utc(value);
  queryBuilder.where(`${fieldName} >= ?`, m.clone().startOf('day').toDate());
  queryBuilder.where(`${fieldName} < ?`, m.clone().endOf('day').toDate());
};

export const addMinuteDateQueryToBuilder = (queryBuilder, fieldName, value) => {
  const m = utc(value);
  queryBuilder.where(`${fieldName} >= ?`, m.clone().toDate());
  queryBuilder.where(`${fieldName} < ?`, m.clone().add(1, 'minutes').toDate());
};

export const addBetweenQueryToBuilder = (queryBuilder, fieldName, value) => {
  const [start, end] = value.split(',').map(d => d ? utc(d) : d);
  if (start) {
    queryBuilder.where(`${fieldName} >= ?`, start.startOf('day').toDate());
  }
  if (end) {
    queryBuilder.where(`${fieldName} < ?`, end.endOf('day').toDate());
  }
};
