import t from 'tcomb';
import Promise from 'bluebird';
import {CronJob} from 'cron';
import debug from 'debug';

import '../types';
import './types';

import {ScheduledTaskRepository} from '../scheduled-events/models';
import {utc} from '../lib/date';
import {ScheduleTaskType} from '../scheduled-events/types';
import {BuildingRepository} from '../building/models';

const cronDebug = debug('app:cron:firebase');

const timeZone = 'UTC';
const cronTime = '*/1 * * * *';

async function executeScheduledTasks() {
  const moment = utc().toISOString();
  const tasksRepo = new ScheduledTaskRepository();
  const tasks = await tasksRepo.findTasksToExecute(moment);

  cronDebug('executeScheduledTasks at', moment, `Found ${tasks.length} tasks`);
  await Promise.map(tasks, executeTask);
}

/**
 * Execute tasks based on type
 * exception caught locally to not disturb another running tasks
 * @param task
 * @return {Promise<void>}
 */
async function executeTask(task) {
  try {
    switch (task.type) {
      case ScheduleTaskType.UPDATE_BUILDING:
        return updateBuilding(task.context);
      default:
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(`${task.type} not registered`);
    }
  } catch (e) {
    console.error(`executeTask fails for ${JSON.stringify(task)}`, e);
  }
}

async function updateBuilding(context) {
  const buildingRepo = new BuildingRepository();
  const building = buildingRepo.findByIdOrThrow(context.id);
  const updatedBuilding = t.update(building, {$merge: context});
  return buildingRepo.save(updatedBuilding);
}

export default new CronJob({
  cronTime,
  timeZone,
  onTick: executeScheduledTasks,
  start: false
});
