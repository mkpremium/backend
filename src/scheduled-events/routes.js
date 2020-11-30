import { Router } from 'express'

import {
  addScheduledCallEventController,
  findScheduledEventController,
  listScheduledEventController,
  updateScheduledEventController,
  weekScheduleEventMeetingsController,

  createAddScheduledMeetingEventController,
  createDeleteScheduledEventController
} from './controllers'
import { createGetUserScheduledCallsController } from './controller/get-user-scheduled-calls.controller'

export const createScheduleEventsRoutes = (createMeetingService, scheduledCallsService, eventBus) => {
  const router = Router()

  router.get('/week', weekScheduleEventMeetingsController)
  router.get('/', listScheduledEventController)
  router.post('/call', addScheduledCallEventController)
  router.post('/meeting', createAddScheduledMeetingEventController(createMeetingService))
  router.get('/calls', createGetUserScheduledCallsController(scheduledCallsService))
  router.put('/:id', updateScheduledEventController)
  router.delete('/:id', createDeleteScheduledEventController(eventBus))
  router.get('/:id', findScheduledEventController)

  return router
}
