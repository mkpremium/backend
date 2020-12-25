import { createScheduleEventsRoutes } from './routes'

import './types'
import jwt from '../middleware/jwt'
import { setupEventListeners } from './event-listeners'
import { ScheduledCallsRepository } from './repository/scheduled-calls.repository'
import { asFunction, asValue } from 'awilix'
import { ScheduledCallsService } from './service/scheduled-calls.service'

/**
 * @param {AwilixContainer} awilixContainer
 */
export default (
  app,
  { createMeetingService, scheduledCallsService, eventBus, couchbaseAdapter },
  awilixContainer
) => {
  const secured = jwt()

  awilixContainer.register({
    scheduledCallsService: asFunction(({ couchbaseAdapter }) => new ScheduledCallsService(couchbaseAdapter)),
    scheduledEventsModuleRouter: asValue(createScheduleEventsRoutes(
      createMeetingService,
      scheduledCallsService,
      eventBus
    ))
  })

  app.use('/scheduled-events', secured, awilixContainer.resolve('scheduledEventsModuleRouter'))

  setupEventListeners(eventBus, {
    scheduledCallRepository: new ScheduledCallsRepository(couchbaseAdapter)
  })
}
