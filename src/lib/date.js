import m from 'moment-timezone';

export const utc = (date) => date ? m(date).tz('UTC') : m().tz('UTC');
