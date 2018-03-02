import {wrap} from 'express-promise-wrap';
import {ScheduledEventsRepository} from './models';

async function listScheduledEvent(req, res) {
  const repo = new ScheduledEventsRepository();
  const scheduledEvents = await repo.list(req.query);

  res.json(scheduledEvents);
}

async function findByIdScheduledEvent(req, res) {
  const id = req.params.id;
  const repo = new ScheduledEventsRepository();
  const scheduleEvent = await repo.findByIdOrThrow(id);
  res.json(scheduleEvent);
}

async function addScheduledEvent(req, res) {
  const repo = new ScheduledEventsRepository();
  req.body.notifyAt = new Date(req.body.notifyAt);
  req.body.eventDate = new Date(req.body.eventDate);
  const scheduledEvent = await repo.save(req.body);
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
export const findScheduledEventController = wrap(findByIdScheduledEvent);
export const addScheduledEventController = wrap(addScheduledEvent);
export const updateScheduledEnventController = wrap(updateScheduledEvent);
export const deleteScheduledEventController = wrap(deleteScheduledEvent);
