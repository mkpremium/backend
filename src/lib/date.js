import m from 'moment-timezone';

export const utc = () => m().tz('UTC');
