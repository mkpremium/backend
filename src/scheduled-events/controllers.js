import {wrap} from 'express-promise-wrap';
import {ScheduledEventsRepository} from './models';
import {OperatorStats} from '../stats/models';
import {OperatorActions} from '../stats/types';

async function listScheduledEvent(req, res) {
  const repo = new ScheduledEventsRepository();
  const scheduledEvents = await repo.list(req.query);

  res.json(scheduledEvents);
}

async function weekScheduleEventMeetings(req, res) {
  const repo = new ScheduledEventsRepository();
  const {week, year} = req.query;
  const scheduledEventMeetings = await repo.weekScheduleEventMeetings(week, year, req.query);
  res.json(scheduledEventMeetings);
}

async function findByIdScheduledEvent(req, res) {
  const id = req.params.id;
  const repo = new ScheduledEventsRepository();
  const scheduleEvent = await repo.findByIdOrThrow(id);
  res.json(scheduleEvent);
}

async function addScheduledCallEvent(req, res) {
  const repo = new ScheduledEventsRepository();
  const scheduledEvent = await repo.addScheduleCallEvent(req.body, req.user.id);
  await OperatorStats.registerAction(req.user.id, OperatorActions.SCHEDULE_CALL);
  res.status(201).json(scheduledEvent);
}

async function addScheduledMeetingEvent(req, res) {
  const repo = new ScheduledEventsRepository();
  const scheduledEvent = await repo
    .addScheduledMeetingEvent(req.body, req.user.id);
  await OperatorStats.registerAction(req.user.id, OperatorActions.MEETING);
  res.status(201).json(scheduledEvent);
}

async function updateScheduledEvent(req, res) {
  const id = req.params.id;
  const repo = new ScheduledEventsRepository();
  await repo.update(id, req.body);
  res.status(204).send();
}

async function deleteScheduledEvent(req, res) {
  const id = req.params.id;
  const repo = new ScheduledEventsRepository();
  await repo.delete(id);
  res.status(204).send();
}

export const listScheduledEventController = wrap(listScheduledEvent);
export const weekScheduleEventMeetingsController = wrap(weekScheduleEventMeetings);
export const findScheduledEventController = wrap(findByIdScheduledEvent);
export const addScheduledCallEventController = wrap(addScheduledCallEvent);
export const addScheduledMeetingEventController = wrap(addScheduledMeetingEvent);
export const updateScheduledEnventController = wrap(updateScheduledEvent);
export const deleteScheduledEventController = wrap(deleteScheduledEvent);
