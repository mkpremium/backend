import { expect } from 'chai'
import { stub } from 'sinon'
import { SmsReceived } from '../../../src/calls/service/sms-webhook.processor'
import { scheduledCallFromOwnerMessage } from '../../../src/scheduled-events/listeners/scheduled-call-from-owner-message'
import { virtualCallerBuilder } from '../../calls/virtual-caller.builder'

describe('scheduledCallFromOwnerMessage', () => {
  let listener: (evt: SmsReceived) => Promise<void>
  let scheduledCallRepositoryStub
  let virtualCallersRepositoryStub
  const testVirtualCaller = virtualCallerBuilder({ assignCallsTo: 'test-assigned-caller-id' }).build()

  beforeEach(() => {
    scheduledCallRepositoryStub = {
      save: stub().resolves(),
    }
    virtualCallersRepositoryStub = {
      get: stub().resolves(testVirtualCaller),
    }

    listener = scheduledCallFromOwnerMessage({
      scheduledCallsRepository: scheduledCallRepositoryStub,
      virtualCallersRepository: virtualCallersRepositoryStub,
    })
  })

  it('schedules call with assigned caller', async () => {
    const testSmsReceived: SmsReceived = {
      name: 'virtual_caller.sms_received',
      callerId: 'test-caller-id',
      buildingId: 'test-building-id',
      worksheetId: 'test-worksheet-id',
      ownerId: 'test-owner-id',
      contactId: 'test-contact-id',
      message: '',
    }

    await listener(testSmsReceived)

    expect(scheduledCallRepositoryStub.save).to.have.been.called
    const savedCall = scheduledCallRepositoryStub.save.lastCall.firstArg
    expect(savedCall).to.include({
      type: 'CALLS',
      createdBy: testSmsReceived.callerId,
      notifyTo: testVirtualCaller.assignCallsTo,
    })
    expect(savedCall.event).to.include({
      buildingId: testSmsReceived.buildingId,
      worksheetId: testSmsReceived.worksheetId,
      ownerId: testSmsReceived.ownerId,
      contactId: testSmsReceived.contactId,
    })
  })
})
