import {CronJob} from 'cron';
import debug from 'debug';
import {utc} from '../lib/date';

import '../types';
import './types';

import {ScheduledEventsRepository} from './models';

const cronjobsDebug = debug('app:cron:scheduledEvents');

const timeZone = 'UTC';
const time = '*/1 * * * *';

async function seekEventsToNotify() {
  cronjobsDebug(`Seeking scheduled events at 2018-03-01T14:55:00.000Z`); // ${utc().startOf('minute').toISOString()}`);
  const repo = new ScheduledEventsRepository();
  const query = {
    notifyAt: '2018-03-01T14:55:00.000Z' // utc().startOf('minute').toISOString()
  };
  const events = await repo.list(query);
  cronjobsDebug(`Found ${events.total} events`);
  if (events.total > 0) {
    events.results.map((scheduleEvent) => {
      cronjobsDebug(`Emitting event for user ${scheduleEvent.userId}`);
    });
  }
}

export default new CronJob({
  cronTime: time,
  onTick: seekEventsToNotify,
  start: false,
  timeZone
});
