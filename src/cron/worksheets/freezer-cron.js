import {CronJob} from 'cron';
import debug from 'debug';
import {utc} from '../../lib/date';
import {moveWorksheetOutOfFreezer} from '../../business/worksheets/freezer';
import {SystemPreferencesRepository} from '../../system-preferences/models';

const cronDebug = debug('app:cron:worksheets:freezer');
const timeZone = 'UTC';
const cronTime = '*/5 * * * *'; // every 5 minutes

async function onTick() {
  const pref = await SystemPreferencesRepository.getPreferences();
  if (pref.freezer.enable) {
    cronDebug(`Executing freezer cron at ${utc().startOf('minute').toISOString()}`);
    await moveWorksheetOutOfFreezer();
  }
}

export default new CronJob({
  start: false,
  cronTime,
  timeZone,
  onTick
});
