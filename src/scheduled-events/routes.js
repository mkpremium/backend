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

const router = Router()

router.get('/week', weekScheduleEventMeetingsController)

router.get('/:id', findScheduledEventController)

router.get('/', listScheduledEventController)

router.post('/call', addScheduledCallEventController)

router.put('/:id', updateScheduledEventController)

router.delete('/:id', deleteScheduledEventController)

export const createScheduleEventsRoutes = (createMeetingService) => {
  router.post('/meeting', createAddScheduledMeetingEventController(createMeetingService))

  return router
}
