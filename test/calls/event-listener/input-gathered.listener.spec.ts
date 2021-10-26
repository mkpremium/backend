import { InputGathered, OwnerResponse } from '../../../src/calls/service/owner-response-processor.service'
import { createInputGatheredListener } from '../../../src/calls/event-listener/input-gathered.listener'
import { stub } from 'sinon'
import { expect } from 'chai'
import * as TE from 'fp-ts/TaskEither'
import { constVoid } from 'fp-ts/function'
import { virtualCallerBuilder } from '../virtual-caller.builder'

describe('input-gathered.listener', () => {
  let listener: (evt: InputGathered) => Promise<void>
  let leadRecorderServiceStub
  let virtualCallersRepositoryStub
  let updateBuildingNegotiationStatusStub
  let changeContactStatusServiceStub

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
    virtualCallersRepositoryStub = {
      get: stub(),
    }
    virtualCallersRepositoryStub.get.withArgs(testEvent.callerId).resolves(testVirtualCaller)
    leadRecorderServiceStub = {
      recordLead: stub(),
    }
    updateBuildingNegotiationStatusStub = {
      updateBuildingStatus: stub(),
    }
    changeContactStatusServiceStub = {
      change: stub(),
    }

    listener = createInputGatheredListener({
      leadRecorder: leadRecorderServiceStub,
      virtualCallersRepository: virtualCallersRepositoryStub,
      updateBuildingNegotiationStatusService: updateBuildingNegotiationStatusStub,
      changeContactStatusService: changeContactStatusServiceStub,
      logger: { info: () => undefined },
    })
  })

  it('records lead when owner is open to sell', async () => {
    leadRecorderServiceStub.recordLead.returns(TE.of(constVoid))

    await listener({ ...testEvent, ownerResponse: OwnerResponse.SALE })

    expect(leadRecorderServiceStub.recordLead).to.have.been.calledWith({
      buildingId: testEvent.buildingId,
      contactId: testEvent.contactId,
      worksheetId: testEvent.worksheetId,
      ownerId: testEvent.ownerId,
      toFlipperId: testVirtualCaller.assignCallsTo,
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
