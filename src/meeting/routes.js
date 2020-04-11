import { Router } from 'express'
import { getUserMeetingsController } from './controllers'

export const meetingRoutes = () => {
  const router = new Router()
  router.get('/users/:id/meetings', getUserMeetingsController())

  return router
}
