import { asClass, asFunction, AwilixContainer } from 'awilix'
import { CreateMeetingService } from './service/create-meeting.service'
import { ScheduledCallsService } from './service/scheduled-calls.service'
import { MeetingsService } from './service/meetings.service'
import { GetSelfMeetingsService } from './service/get-self-meetings.service'
import { ScheduleCallService } from './service/schedule-call.service'
import { createAddScheduledCallController } from './controller/add-schedule-call.controller'
import { createAddScheduledMeetingEventController } from './controller/add-meeting.controller'
import { getUserScheduledCallsControllerFactory } from './controller/get-user-scheduled-calls.controller'
import { deleteScheduledEventControllerFactory } from './controller/delete-scheduled-event.controller'
import { selfMeetingsControllerFactory } from './controller/get-self-meetings.controller'
import { removeCallsOnNewMeetingOrOfferRequest } from './listeners/remove-calls-on-new-meeting-or-offer-request'
import { removeScheduledCallsOnOwnerRefusal } from './listeners/remove-scheduled-calls-on-owner-refusal'
import { removeScheduledCallOnDiscardedContact } from './listeners/remove-scheduled-call-on-discarded-contact'
import { updateScheduledCallController } from './controller/update-schedule-call.controller'
import { PostgresScheduledEventsRepository } from './repository/postgres-schedule-events.repository'
import { importScheduledEventHandlerFactory } from './service/scheduled-event-importer.service'
import { RemoveScheduledCallsService } from './service/remove-scheduled-calls.service'

export async function setupScheduledEventsDependencies (container: AwilixContainer) {
  container.register({
    createMeetingService: asClass(CreateMeetingService).classic(),
    removeScheduledCallsService: asClass(RemoveScheduledCallsService).classic().singleton(),
    scheduledCallsService: asClass(ScheduledCallsService).classic(),
    scheduledEventsRepository: asClass(PostgresScheduledEventsRepository).classic().singleton(),
    meetingsService: asClass(MeetingsService).classic().singleton(),

    getUserMeetingsService: asClass(GetSelfMeetingsService).classic().singleton(),
    scheduleCall: asClass(ScheduleCallService).classic().singleton(),
    importScheduledEventCommandHandler: asFunction(importScheduledEventHandlerFactory).singleton(),

    addScheduledCallController: asFunction(createAddScheduledCallController).singleton(),
    updateScheduledCallController: asFunction(updateScheduledCallController).singleton(),
    addMeetingController: asFunction(createAddScheduledMeetingEventController).singleton(),
    getUserScheduledCallsController: asFunction(getUserScheduledCallsControllerFactory).singleton(),
    deleteScheduledEventController: asFunction(deleteScheduledEventControllerFactory).singleton(),
    selfMeetingsController: asFunction(selfMeetingsControllerFactory).singleton(),

    removeCallsOnNewMeetingOrOfferRequest: asFunction(removeCallsOnNewMeetingOrOfferRequest).singleton(),
    removeScheduledCallsOnOwnerRefusal: asFunction(removeScheduledCallsOnOwnerRefusal).singleton(),
    removeScheduledCallOnDiscardedContact: asFunction(removeScheduledCallOnDiscardedContact).singleton()
  })
}
