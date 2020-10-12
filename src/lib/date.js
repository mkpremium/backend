import m from 'moment-timezone'

export const utc = (date) => date ? m(date).tz('UTC') : m().tz('UTC')

export const buildRangeFromWeek = (week, year) => {
  const date = m(new Date(year, 1, 1)).tz('UTC').week(week)
  return [
    date.clone().startOf('week').toDate(),
    date.clone().endOf('week').toDate()
  ].join(',')
}

export const queryDateFormat = date => m(date).format('YYYY-MM-DD')
