import { createScheduleEventsRoutes } from './routes'

import './types'
import jwt from '../middleware/jwt'
import { setupEventListeners } from './event-listeners'
import { ScheduledCallsRepository } from './repository/scheduled-calls.repository'
import { asClass } from 'awilix'
import { ScheduledCallsService } from './service/scheduled-calls.service'
import { CreateMeetingService } from './service/create-meeting.service'
import { ScheduledEventsRepository } from './repository/ScheduleEventsRepository'

/**
 * @param {AwilixContainer} awilixContainer
 */
export default (app, awilixContainer) => {
  const secured = jwt()

  awilixContainer.register({
    createMeetingService: asClass(CreateMeetingService).classic(),
    scheduledCallsService: asClass(ScheduledCallsService).classic(),
    scheduledCallsRepository: asClass(ScheduledCallsRepository).classic(),
    scheduledEventsRepository: asClass(ScheduledEventsRepository)
  })

  app.use('/scheduled-events', secured, createScheduleEventsRoutes(
    awilixContainer.resolve('createMeetingService'),
    awilixContainer.resolve('scheduledCallsService'),
    awilixContainer.resolve('eventBus')
  ))

  setupEventListeners(awilixContainer.resolve('eventBus'), {
    scheduledCallRepository: awilixContainer.resolve('scheduledCallsRepository')
  })
}
