import { expect } from 'chai'
import { stub } from 'sinon'
import { CallDone } from '../../../src/calls/controller/call-done-webhook.controller'
import { createCallFinishedListener } from '../../../src/owner/event-listener/call-finished.listener'
import { ChangeContactStatusService } from '../../../src/owner/service/change-contact-status.service'

describe.only('call-finished.listener', () => {
  let listener: (evt: CallDone) => Promise<void>
  let changeContactStatusServiceStub

  beforeEach(() => {
    changeContactStatusServiceStub = {
      change: stub(),
    }
    listener = createCallFinishedListener({
      changeContactStatusService: changeContactStatusServiceStub as ChangeContactStatusService,
    })
  })

  it('discard Spanish landline contact on failed call', async () => {
    const testEvt: CallDone = {
      name: 'virtual-caller.call_finished',
      callId: 'test-call-id',
      contactId: 'test-contact-id',
      ownerId: 'test-owner-id',
      phoneNumber: '+34966666666',
      status: 'FAILED'
    }
    changeContactStatusServiceStub.change.resolves()

    await listener(testEvt)

    expect(changeContactStatusServiceStub.change).to.have.been.calledWith({
      ownerId: testEvt.ownerId,
      contactId: testEvt.contactId,
      status: 'BAD'
    })
  })
})
