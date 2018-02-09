import m from 'moment-timezone';

export const utc = (date) => date ? m().tz(date, 'UTC') : m().tz('UTC');
