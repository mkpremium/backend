import { createScheduleEventsRoutes } from './routes'

import './types'
import jwt from '../middleware/jwt'
import { setupEventListeners } from './event-listeners'
import { ScheduledCallsRepository } from './repository/scheduled-calls.repository'

export default (app, { createMeetingService, scheduledCallsService, eventBus, couchbaseAdapter }) => {
  const secured = jwt()

  app.use('/scheduled-events',
    secured,
    createScheduleEventsRoutes(
      createMeetingService,
      scheduledCallsService,
      eventBus
    )
  )

  setupEventListeners(eventBus, {
    scheduledCallRepository: new ScheduledCallsRepository(couchbaseAdapter)
  })
}
