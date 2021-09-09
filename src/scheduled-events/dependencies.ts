import { asClass, asFunction, AwilixContainer } from 'awilix'
import { MeetingsRepository } from './repository/meetings.repository'
import { CreateMeetingService } from './service/create-meeting.service'
import { ScheduledCallsService } from './service/scheduled-calls.service'
import { ScheduledCallsRepository } from './repository/scheduled-calls.repository'
import { ScheduledEventsRepository } from './repository/schedule-events.repository'
import { SelfMeetingsRepository } from './repository/self-meetings.repository'
import { MeetingsService } from './service/meetings.service'
import { GetSelfMeetingsService } from './service/get-self-meetings.service'
import { ScheduleCallService } from './service/schedule-call.service'
import { createAddScheduledCallController } from './controller/add-schedule-call.controller'
import { createAddScheduledMeetingEventController } from './controller/add-meeting.controller'
import { createGetUserScheduledCallsController } from './controller/get-user-scheduled-calls.controller'
import { createDeleteScheduledEventController } from './controller/delete-scheduled-event.controller'
import { selfMeetingsController } from './controller/get-self-meetings.controller'
import { scheduledCallFromOwnerMessage } from './listeners/scheduled-call-from-owner-message'
import { removeCallsOnNewMeeting } from './listeners/remove-calls-on-new-meeting'
import { removeScheduledCallsOnOwnerRefusal } from './listeners/remove-scheduled-calls-on-owner-refusal'

export function setupScheduledEventsDependencies (container: AwilixContainer) {
  container.register({
    meetingsRepository: asClass(MeetingsRepository).classic(),
    createMeetingService: asClass(CreateMeetingService).classic(),
    scheduledCallsService: asClass(ScheduledCallsService).classic(),
    scheduledCallsRepository: asClass(ScheduledCallsRepository).classic(),
    scheduledEventsRepository: asClass(ScheduledEventsRepository).singleton(),
    selfMeetingsRepository: asClass(SelfMeetingsRepository).classic().singleton(),
    meetingsService: asClass(MeetingsService).singleton(),

    getUserMeetingsService: asClass(GetSelfMeetingsService).classic().singleton(),
    scheduleCall: asClass(ScheduleCallService).classic().singleton(),

    addScheduledCallController: asFunction(createAddScheduledCallController).singleton(),
    addMeetingController: asFunction(createAddScheduledMeetingEventController).singleton(),
    getUserScheduledCallsController: asFunction(createGetUserScheduledCallsController).singleton(),
    deleteScheduledEventController: asFunction(createDeleteScheduledEventController).singleton(),
    selfMeetingsController: asFunction(selfMeetingsController).singleton(),

    scheduledCallFromOwnerMessage: asFunction(scheduledCallFromOwnerMessage).singleton(),
    removeCallsOnNewMeeting: asFunction(removeCallsOnNewMeeting).singleton(),
    removeScheduledCallsOnOwnerRefusal: asFunction(removeScheduledCallsOnOwnerRefusal).singleton(),
  })
}
