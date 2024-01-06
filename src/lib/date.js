import m from 'moment-timezone'

export const utc = (date) => date ? m(date).tz('UTC') : m().tz('UTC')

export const queryDateFormat = date => m(date).format('YYYY-MM-DD')
