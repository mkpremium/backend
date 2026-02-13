import { Router } from 'express'

export const createCallRoutes = container => {
  const router = Router()

  router.put('/schedule-calls', container.resolve('scheduleDailyCallsController'))
  router.get('/schedule-calls', container.resolve('getScheduleDailyCallsController'))
  router.get('/contacts', container.resolve('getCityContactsController'))
  router.post('/call-logs', container.resolve('getCallLogController'))

  return router
}
