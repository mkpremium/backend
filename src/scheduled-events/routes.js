import { Router } from 'express'

import {
  findScheduledEventController,
  listScheduledEventController,
  updateScheduledEventController,
  weekScheduleEventMeetingsController
} from './controllers'
import { wrap } from 'express-promise-wrap'

export const createScheduleEventsRoutes = awilixContainer => {
  const router = Router()

  router.get('/week', weekScheduleEventMeetingsController)
  router.get('/', listScheduledEventController)
  router.post('/call', wrap(awilixContainer.resolve('addScheduledCallController')))
  router.post('/meeting', wrap(awilixContainer.resolve('addMeetingController')))
  router.get('/calls', wrap(awilixContainer.resolve('getUserScheduledCallsController')))

  router.put('/:id', updateScheduledEventController)
  router.delete('/:id', wrap(awilixContainer.resolve('deleteScheduledEventController')))
  router.get('/:id', findScheduledEventController)

  return router
}
