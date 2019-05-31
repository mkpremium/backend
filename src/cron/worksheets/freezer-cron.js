import {CronJob} from 'cron';
import debug from 'debug';
import {utc} from '../../lib/date';
import {moveWorksheetOutOfFreezer} from '../../business/worksheets/freezer';

const cronDebug = debug('app:cron:worksheets:freezer');
const timeZone = 'UTC';
const cronTime = '*/5 * * * *'; // every 5 minutes

async function onTick() {
  cronDebug(`Executing freezer cron at ${utc().startOf('minute').toISOString()}`);
  await moveWorksheetOutOfFreezer();
}

export default new CronJob({
  start: false,
  cronTime,
  timeZone,
  onTick
});
