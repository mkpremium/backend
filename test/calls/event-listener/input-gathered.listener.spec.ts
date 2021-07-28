import { InputGathered, OwnerResponse } from '../../../src/calls/service/owner-response-processor.service'
import { createInputGatheredListener } from '../../../src/calls/event-listener/input-gathered.listener'
import { stub } from 'sinon'
import { expect } from 'chai'
import { virtualCallerBuilder } from '../virtual-caller.builder'

describe('input-gathered.listener', () => {
  let listener: (evt: InputGathered) => Promise<void>
  let scheduleCallServiceStub
  let updateBuildingNegotiationStatusStub
  let changeContactStatusServiceStub
  let virtualCallersRepositoryStub

  const testAssignedCallerId = 'test-caller-id'
  const testVirtualCallerId = 'test-virtual-caller-id'
  const testVirtualCallerQueueId = 'test-queue-id'
  const testEvent: InputGathered = {
    name: 'virtual-caller.input_gathered',
    ownerResponse: OwnerResponse.SALE,
    buildingId: 'test-building-id',
    callId: 'test-call-id',
    callerId: testVirtualCallerId,
    contactId: 'test-contact-id',
    ownerId: 'test-owner-id',
    worksheetId: 'test-worksheet-id',
  }
  const testVirtualCaller = virtualCallerBuilder({
    id: testVirtualCallerId,
    assignCallsTo: testAssignedCallerId,
    queueId: testVirtualCallerQueueId
  }).build()

  beforeEach(() => {
    scheduleCallServiceStub = {
      scheduleCall: stub(),
    }
    updateBuildingNegotiationStatusStub = {
      updateBuildingStatus: stub(),
    }
    changeContactStatusServiceStub = {
      change: stub(),
    }
    virtualCallersRepositoryStub = {
      get: stub(),
    }
    virtualCallersRepositoryStub.get.withArgs(testEvent.callerId).resolves(testVirtualCaller)

    listener = createInputGatheredListener({
      scheduleCall: scheduleCallServiceStub,
      virtualCallersRepository: virtualCallersRepositoryStub,
      updateBuildingNegotiationStatusService: updateBuildingNegotiationStatusStub,
      changeContactStatusService: changeContactStatusServiceStub,
      logger: { info: () => undefined }
    })
  })

  it('schedules call when owner is open to sell', async () => {
    scheduleCallServiceStub.scheduleCall.resolves()
    await listener({ ...testEvent, ownerResponse: OwnerResponse.SALE })

    expect(scheduleCallServiceStub.scheduleCall).to.have.been.calledWith({
      userId: testVirtualCallerId,
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
      queueId: testVirtualCallerQueueId,
    })
  })

  it('save no sale on owner input', async () => {
    updateBuildingNegotiationStatusStub.updateBuildingStatus.resolves()

    await listener({ ...testEvent, ownerResponse: OwnerResponse.NO_SALE })

    expect(updateBuildingNegotiationStatusStub.updateBuildingStatus).to.have.been
      .calledWith(testEvent.buildingId, {
        status: 'NO VENDE',
        userId: testVirtualCallerId,
        sourceOwnerId: testEvent.ownerId,
      })
  })

  it('discards contact when owner', async () => {
    changeContactStatusServiceStub.change.resolves()

    await listener({ ...testEvent, ownerResponse: OwnerResponse.NOT_OWNER })

    expect(changeContactStatusServiceStub.change).to.have.been.calledWith(
      { ownerId: testEvent.ownerId, contactId: testEvent.contactId, status: 'BAD' },
      { id: testVirtualCallerId }
    )
  })
})
