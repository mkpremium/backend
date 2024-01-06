import { ScheduleCallService } from '../../../src/scheduled-events/service/schedule-call.service'
import { stub } from 'sinon'
import { expect } from 'chai'

describe('ScheduleCallService (Couchbase)', () => {
  let service: ScheduleCallService
  let scheduledEventsRepositoryStub
  let legacyWorksheetQueueRepositoryStub
  let eventBusStub
  let worksheetRepositoryStub
  let callSchedulerServiceStub

  beforeEach(() => {
    scheduledEventsRepositoryStub = {
      addScheduleCallEvent: stub(),
    }
    callSchedulerServiceStub = {
      scheduleWorksheetInQueue: stub(),
    }
    legacyWorksheetQueueRepositoryStub = {
      get: stub(),
    }
    eventBusStub = {
      publish: stub(),
    }
    worksheetRepositoryStub = {
      ofBuildingId: stub().resolves({ id: 'test-worksheet-id' }),
    }

    service = new ScheduleCallService(
      scheduledEventsRepositoryStub,
      callSchedulerServiceStub,
      legacyWorksheetQueueRepositoryStub,
      worksheetRepositoryStub,
      eventBusStub,
      false,
      null
    )
  })

  it(`saves scheduled event with building's worksheetID`, async () => {
    await service.scheduleCall({
      userId: 'test-user-id',
      queueId: 'test-queue-id',
      event: {
        createdAt: undefined,
        createdBy: '',
        event: {
          buildingId: 'test-building-id',
          ownerId: 'test-owner-id',
          contactId: 'test-contact-id',
          inPerson: false,
          worksheetId: undefined
        },
        eventDate: undefined,
        note: '',
        notifyTo: '',
      }
    })

    expect(scheduledEventsRepositoryStub.addScheduleCallEvent).to.have.been.called
    expect(scheduledEventsRepositoryStub.addScheduleCallEvent.lastCall.firstArg.event.worksheetId).to.equal('test-worksheet-id')
  })
})
