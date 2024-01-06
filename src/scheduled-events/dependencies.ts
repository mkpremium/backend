import { aliasTo, asClass, asFunction, AwilixContainer } from 'awilix'
import { MeetingsRepository } from './repository/meetings.repository'
import { CreateMeetingService } from './service/create-meeting.service'
import { ScheduledCallsService } from './service/scheduled-calls.service'
import { ScheduledCallsRepository } from './repository/scheduled-calls.repository'
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
import { removeCallsOnNewMeetingOrOfferRequest } from './listeners/remove-calls-on-new-meeting-or-offer-request'
import { removeScheduledCallsOnOwnerRefusal } from './listeners/remove-scheduled-calls-on-owner-refusal'
import { removeScheduledCallOnDiscardedContact } from './listeners/remove-scheduled-call-on-discarded-contact'
import { updateScheduledCallController } from './controller/update-schedule-call.controller'
import { CouchbaseScheduledEventsRepository } from './repository/couchbase-schedule-events.repository'

export function setupScheduledEventsDependencies (container: AwilixContainer) {
  container.register({
    meetingsRepository: asClass(MeetingsRepository).classic(),
    createMeetingService: asClass(CreateMeetingService).classic(),
    scheduledCallsService: asClass(ScheduledCallsService).classic(),
    scheduledCallsRepository: asClass(ScheduledCallsRepository).classic(),
    couchbaseScheduledEventsRepository: asClass(CouchbaseScheduledEventsRepository).singleton(),
    scheduledEventsRepository: aliasTo('couchbaseScheduledEventsRepository'),
    selfMeetingsRepository: asClass(SelfMeetingsRepository).classic().singleton(),
    meetingsService: asClass(MeetingsService).singleton(),

    getUserMeetingsService: asClass(GetSelfMeetingsService).classic().singleton(),
    scheduleCall: asClass(ScheduleCallService).classic().singleton(),

    addScheduledCallController: asFunction(createAddScheduledCallController).singleton(),
    updateScheduledCallController: asFunction(updateScheduledCallController).singleton(),
    addMeetingController: asFunction(createAddScheduledMeetingEventController).singleton(),
    getUserScheduledCallsController: asFunction(createGetUserScheduledCallsController).singleton(),
    deleteScheduledEventController: asFunction(createDeleteScheduledEventController).singleton(),
    selfMeetingsController: asFunction(selfMeetingsController).singleton(),

    scheduledCallFromOwnerMessage: asFunction(scheduledCallFromOwnerMessage).singleton(),
    removeCallsOnNewMeetingOrOfferRequest: asFunction(removeCallsOnNewMeetingOrOfferRequest).singleton(),
    removeScheduledCallsOnOwnerRefusal: asFunction(removeScheduledCallsOnOwnerRefusal).singleton(),
    removeScheduledCallOnDiscardedContact: asFunction(removeScheduledCallOnDiscardedContact).singleton(),
  })
}
