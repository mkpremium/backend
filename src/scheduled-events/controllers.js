import { wrap } from 'express-promise-wrap'
import { ScheduledEventsRepository } from './repository/ScheduleEventsRepository'
import { OperatorStats } from '../stats/models'
import { OperatorActions } from '../stats/types'
import { LegacyWorksheetQueueRepository } from '../worksheet/models/queue-repository'
import { canScheduleCall } from '../lib/role-operators'

async function listScheduledEvent (req, res) {
  const repo = new ScheduledEventsRepository()
  const scheduledEvents = await repo.list(req.query)

  res.json(scheduledEvents)
}

async function weekScheduleEventMeetings (req, res) {
  const repo = new ScheduledEventsRepository()
  const { week, year } = req.query
  const scheduledEventMeetings = await repo.weekScheduleEventMeetings(week, year, req.query)
  res.json(scheduledEventMeetings)
}

async function findByIdScheduledEvent (req, res) {
  const id = req.params.id
  const repo = new ScheduledEventsRepository()
  const scheduleEvent = await repo.findByIdOrThrow(id)
  res.json(scheduleEvent)
}

async function addScheduledCallEvent (req, res) {
  const repo = new ScheduledEventsRepository()
  const queueRepo = new LegacyWorksheetQueueRepository()

  canScheduleCall(req.user.operator, req.body.notifyTo)

  const scheduledEvent = await repo.addScheduleCallEvent(req.body, req.user.id)

  const queue = await queueRepo.findByIdOrThrow(req.user.operator.profile.queueId)
  await queueRepo.scheduleWorksheetInQueue(queue, scheduledEvent)

  await OperatorStats.registerAction(req.user.id, OperatorActions.SCHEDULE_CALL)
  res.status(201).json(scheduledEvent)
}

async function updateScheduledEvent (req, res) {
  const id = req.params.id
  const repo = new ScheduledEventsRepository()
  await repo.update(id, req.body)
  res.status(204).send()
}

export const SCHEDULED_EVENT_DELETED = 'SCHEDULED_EVENT_DELETED'

class ScheduledEventDeleted {
  constructor (id) {
    this.id = id
    this.name = SCHEDULED_EVENT_DELETED
  }
}

const deleteScheduledEvent = eventBus => async (req, res) => {
  const id = req.params.id
  const repo = new ScheduledEventsRepository()
  await repo.delete(id)
  eventBus.publish(new ScheduledEventDeleted(id))
  res.status(204).send()
}

export const listScheduledEventController = wrap(listScheduledEvent)
export const weekScheduleEventMeetingsController = wrap(weekScheduleEventMeetings)
export const findScheduledEventController = wrap(findByIdScheduledEvent)
export const addScheduledCallEventController = wrap(addScheduledCallEvent)
export const updateScheduledEventController = wrap(updateScheduledEvent)
export const createDeleteScheduledEventController = eventBus => wrap(deleteScheduledEvent(eventBus))

/**
 * @param {CreateMeetingService} createMeetingService
 */
export const createAddScheduledMeetingEventController = (createMeetingService) => {
  return wrap(async (req, res) => {
    const scheduledEvent = await createMeetingService.createMeeting(req.user.operator, req.body)
    res.status(201).json(scheduledEvent)
  })
}
