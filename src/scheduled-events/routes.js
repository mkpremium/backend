import { Router } from 'express'
import { wrap } from 'express-promise-wrap'

export const createScheduleEventsRoutes = awilixContainer => {
  const router = Router()

  router.post('/call', wrap(awilixContainer.resolve('addScheduledCallController')))
  router.post('/meeting', wrap(awilixContainer.resolve('addMeetingController')))
  router.get('/calls', wrap(awilixContainer.resolve('getUserScheduledCallsController')))

  router.put('/:id', wrap(awilixContainer.resolve('updateScheduledCallController')))
  router.delete('/:id', wrap(awilixContainer.resolve('deleteScheduledEventController')))

  return router
}
