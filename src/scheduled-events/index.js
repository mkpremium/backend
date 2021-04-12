import { createScheduleEventsRoutes } from './routes'

import './types'
import jwt from '../middleware/jwt'
import { setupEventListeners } from './event-listeners'
import { ScheduledCallsRepository } from './repository/scheduled-calls.repository'
import { asClass, asFunction } from 'awilix'
import { ScheduledCallsService } from './service/scheduled-calls.service'
import { LegacyCreateMeetingService } from './service/legacy-create-meeting.service'
import { ScheduledEventsRepository } from './repository/ScheduleEventsRepository'
import { MeetingsService } from './service/meetings.service'
import { MeetingsRepository } from './repository/meetings.repository'
import { createAddScheduledCallController } from './controller/add-schedule-call.controller'
import { createAddScheduledMeetingEventController } from './controller/add-meeting.controller'
import { createGetUserScheduledCallsController } from './controller/get-user-scheduled-calls.controller'
import { createDeleteScheduledEventController } from './controller/delete-scheduled-event.controller'

export const setupScheduledEventsDependencies = awilixContainer => {
  awilixContainer.register({
    meetingsRepository: asClass(MeetingsRepository).classic(),
    createMeetingService: asClass(LegacyCreateMeetingService).classic(),
    scheduledCallsService: asClass(ScheduledCallsService).classic(),
    scheduledCallsRepository: asClass(ScheduledCallsRepository).classic(),
    scheduledEventsRepository: asClass(ScheduledEventsRepository).singleton(),
    meetingsService: asClass(MeetingsService).singleton(),

    addScheduledCallController: asFunction(createAddScheduledCallController).singleton(),
    addMeetingController: asFunction(createAddScheduledMeetingEventController).singleton(),
    getUserScheduledCallsController: asFunction(createGetUserScheduledCallsController).singleton(),
    deleteScheduledEventController: asFunction(createDeleteScheduledEventController).singleton()
  })
}

/**
 * @param {AwilixContainer} awilixContainer
 */
export const setupScheduledEventsRoutes = (app, awilixContainer) => {
  const secured = jwt()

  app.use('/scheduled-events', secured, createScheduleEventsRoutes(awilixContainer))

  setupEventListeners(awilixContainer.resolve('eventBus'), {
    scheduledCallRepository: awilixContainer.resolve('scheduledCallsRepository')
  })
}
