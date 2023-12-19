import { AwilixContainer } from 'awilix'
import { createScheduleEventsRoutes } from './routes'
import { wrap } from 'express-promise-wrap'
import { Express } from 'express'

export function scheduledEventsRoutes(container: AwilixContainer, app: Express, secured) {
  app.use('/scheduled-events', secured, createScheduleEventsRoutes(container))
  app.get('/me/meetings', secured, wrap(container.resolve('selfMeetingsController')))
}
