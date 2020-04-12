import { Router } from 'express'
import { getUserMeetingsController } from './controllers'

export const meetingRoutes = getUserMeetingsService => {
  const router = new Router()
  router.get('/me/meetings', getUserMeetingsController(getUserMeetingsService))

  return router
}
