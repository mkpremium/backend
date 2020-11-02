import { Router } from 'express'
import { getUserMeetingsController } from './controllers'
import { wrap } from 'express-promise-wrap'

export const meetingRoutes = getUserMeetingsService => {
  const router = new Router()
  router.get('/me/meetings', wrap(getUserMeetingsController(getUserMeetingsService)))

  return router
}
