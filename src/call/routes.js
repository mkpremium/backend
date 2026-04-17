import { Router } from 'express'
import { wrap } from 'express-promise-wrap'

export const createCallRoutes = (container) => {
  const router = Router()

  router.put('/schedule-calls', wrap(container.resolve('saveScheduleCallsController')))
  router.get('/schedule-calls', wrap(container.resolve('getScheduleCallsController')))
  router.delete('/schedule-calls', wrap(container.resolve('deleteScheduleCallsController')))
  router.get('/contacts', wrap(container.resolve('getCityContactsController')))
  router.post('/call-logs', wrap(container.resolve('getCallLogController')))
  router.post('/send-calls', wrap(container.resolve('sendCallsController')))
  router.post('/schedule-callback', wrap(container.resolve('getCallbackController')))
  router.post('/owner-contact', wrap(container.resolve('getNewOwnerContactController')))

  return router
}
