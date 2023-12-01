import { wrap } from 'express-promise-wrap'
import { ScheduledEventsRepository } from './repository/schedule-events.repository'

async function weekScheduleEventMeetings (req, res) {
  const repo = new ScheduledEventsRepository()
  const { week, year } = req.query
  const scheduledEventMeetings = await repo.weekScheduleEventMeetings(week, year)
  res.json(scheduledEventMeetings)
}

async function findByIdScheduledEvent (req, res) {
  const id = req.params.id
  const repo = new ScheduledEventsRepository()
  const scheduleEvent = await repo.findByIdOrThrow(id)
  res.json(scheduleEvent)
}

export const weekScheduleEventMeetingsController = wrap(weekScheduleEventMeetings)
export const findScheduledEventController = wrap(findByIdScheduledEvent)
