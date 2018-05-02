import {CronJob} from 'cron';
import debug from 'debug';
import {utc} from '../lib/date';
import {connectServer} from '../../src/socket/client';

import '../types';
import './types';

import {ScheduledEventsRepository} from './models';

const cronjobsDebug = debug('app:cron:scheduledEvents');

const timeZone = 'UTC';
const time = '*/1 * * * *';

async function seekEventsToNotify() {
  cronjobsDebug(`Seeking scheduled events at ${utc().startOf('minute').toISOString()}`);
  const repo = new ScheduledEventsRepository();
  const query = {
    notifyAt: utc().startOf('minute').toISOString()
  };
  const events = await repo.list(query);
  cronjobsDebug(`Found ${events.total} events`);
  if (events.total > 0) {
    events.results.map(async(scheduleEvent) => {
      const socket = await connectServer();
      await socket.sendEvent('notification', scheduleEvent);
    });
  }
}

export default new CronJob({
  cronTime: time,
  onTick: seekEventsToNotify,
  start: false,
  timeZone
});
