import { Router } from 'express'
import { wrap } from 'express-promise-wrap'

export const createCallRoutes = container => {
  const router = Router()

  router.put('/schedule-calls', wrap(container.resolve('scheduleDailyCallsController')))
  router.get('/schedule-calls', wrap(container.resolve('getScheduleDailyCallsController')))
  router.get('/contacts', wrap(container.resolve('getCityContactsController')))

  return router
}
