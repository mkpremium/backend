import { Router } from 'express'

import {
  addScheduledCallEventController,
  findScheduledEventController,
  listScheduledEventController,
  updateScheduledEventController,
  deleteScheduledEventController,
  weekScheduleEventMeetingsController,

  createAddScheduledMeetingEventController
} from './controllers'
import { createGetUserScheduledCallsController } from './controller/get-user-scheduled-calls.controller'

const router = Router()

router.get('/week', weekScheduleEventMeetingsController)

router.get('/', listScheduledEventController)

router.post('/call', addScheduledCallEventController)

router.put('/:id', updateScheduledEventController)

router.delete('/:id', deleteScheduledEventController)

export const createScheduleEventsRoutes = (createMeetingService, scheduledCallsService) => {
  router.post('/meeting', createAddScheduledMeetingEventController(createMeetingService))

  router.get('/calls', createGetUserScheduledCallsController(scheduledCallsService))

  router.get('/:id', findScheduledEventController)

  return router
}
