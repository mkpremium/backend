import m from 'moment-timezone'

export const utc = (date) => date ? m(date).tz('UTC') : m().tz('UTC')
export const madrid = (date) => date ? m(date).tz('Europe/Madrid') : m().tz('Europe/Madrid')

export const buildRangeFromWeek = (week, year) => {
  const date = m(new Date(year, 1, 1)).tz('UTC').week(week)
  return [
    date.clone().startOf('week').toDate(),
    date.clone().endOf('week').toDate()
  ].join(',')
}

export const meetingDayFormat = date => m(date).format('DD-MM-YYYY')
export const meetingWeekFormat = date => m(date).format('YYYY:WW')
export const queryDateFormat = date => m(date).format('YYYY-MM-DD')

export function firebaseTimestampFormat (date) {
  if (date) {
    return (new Date(date)).valueOf()
  }
  return 0
}

export function firebaseStringToNumber (number) {
  const n = Number(number || 0)
  if (isNaN(n)) {
    return 0
  } else {
    return n
  }
}
