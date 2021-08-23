import { AwilixContainer } from 'awilix'
import jwt from '../middleware/jwt'
import { createScheduleEventsRoutes } from './routes'
import { wrap } from 'express-promise-wrap'
import { Express } from 'express'

export function scheduledEventsRoutes(container: AwilixContainer, app: Express) {
  const secured = jwt()

  app.use('/scheduled-events', secured, createScheduleEventsRoutes(container))
  app.get('/me/meetings', secured, wrap(container.resolve('selfMeetingsController')))
}
