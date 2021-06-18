import { InputGathered, OwnerResponse } from '../../../src/calls/service/owner-response-processor.service'
import { createInputGatheredListener } from '../../../src/calls/event-listener/input-gathered.listener'
import { stub } from 'sinon'
import { expect } from 'chai'

describe('input-gathered.listener', () => {
  let listener: (evt: InputGathered) => Promise<void>
  let scheduleCallServiceStub
  const testEvent: InputGathered = {
    name: 'virtual-caller.input_gathered',
    ownerResponse: OwnerResponse.SALE,
    buildingId: 'test-building-id',
    callId: 'test-call-id',
    contactId: 'test-contact-id',
    ownerId: 'test-owner-id',
    worksheetId: 'test-worksheet-id',
  }
  const testAssignedCallerId = 'test-caller-id'
  const testVirtualCallerId = 'test-virtual-caller-id'
  const testVirtualCallerQueueId = 'test-queue-id'

  beforeEach(() => {
    scheduleCallServiceStub = {
      scheduleCall: stub().resolves(),
    }

    listener = createInputGatheredListener({
      scheduleCall: scheduleCallServiceStub,
      assignedCallerIdForVirtualCalls: testAssignedCallerId,
      virtualCallerQueueId: testVirtualCallerQueueId,
      virtualCallerId: testVirtualCallerId,
    })
  })

  it('schedules call when owner is open to sell', async () => {
    await listener(testEvent)

    expect(scheduleCallServiceStub.scheduleCall).to.have.been.calledWith({
      userId: testVirtualCallerId,
      queueId: testVirtualCallerQueueId,
      event: {
        createdBy: testVirtualCallerId,
        event: {
          buildingId: testEvent.buildingId,
          contactId: testEvent.contactId,
          worksheetId: testEvent.worksheetId,
          ownerId: testEvent.ownerId,
        },
        eventDate: new Date(),
        notifyTo: testAssignedCallerId,
        type: 'CALLS',
        note: 'Creada por caller virtual',
      },
    })
  })
})
