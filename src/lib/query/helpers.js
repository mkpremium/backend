import { utc } from '../date'
import m from 'moment-timezone'
import { extendMoment } from 'moment-range'
import moment from 'moment'

const mr = extendMoment(m)

export const splitDateRange = value => value.split(',').map(d => d ? moment.utc(d) : d)

export const addDateQueryToBuilder = (queryBuilder, fieldName, value) => {
  const m = utc(value)
  queryBuilder.where(`${fieldName} >= ?`, m.clone().startOf('day').toDate())
  queryBuilder.where(`${fieldName} < ?`, m.clone().endOf('day').toDate())
}

export const addMinuteBetweenQueryToBuilder = (queryBuilder, fieldName, value) => {
  const [start, end] = splitDateRange(value)
  if (start) {
    queryBuilder.where(`${fieldName} > ?`, start.toDate())
  }
  if (end) {
    queryBuilder.where(`${fieldName} < ?`, end.add(1, 'minutes').toDate())
  }
}

export const addBetweenQueryToBuilder = (queryBuilder, fieldName, value) => {
  const [start, end] = splitDateRange(value)
  if (start) {
    queryBuilder.where(`${fieldName} >= ?`, start.startOf('day').toDate())
  }
  if (end) {
    queryBuilder.where(`${fieldName} < ?`, end.endOf('day').toDate())
  }
}

export const rangeStartEnd = (start, end) => mr.range(start, end)
export const dailyRange = dateRange => rangeStartEnd(...dateRange.split(',')).by('day')
export const dateRangeArray = (dateRange) => Array.from(dailyRange(dateRange))
