import { expect } from 'chai'
import { stub } from 'sinon'
import { createCallFinishedListener } from '../../../src/owner/event-listener/call-finished.listener'
import { ChangeContactStatusService } from '../../../src/owner/service/change-contact-status.service'
import { CallDone } from '../../../src/calls/service/call-finished.processor'

describe('call-finished.listener', () => {
  let listener: (evt: CallDone) => Promise<void>
  let changeContactStatusServiceStub
  const testEvt: CallDone = {
    name: 'virtual-caller.call_finished',
    callId: 'test-call-id',
    callerId: 'test-caller-id',
    contactId: 'test-contact-id',
    ownerId: 'test-owner-id',
    phoneNumber: '+34966666666',
    status: 'FAILED',
    ownerResponse: undefined,
    worksheetId: 'test-worksheet-id',
  }

  beforeEach(() => {
    changeContactStatusServiceStub = {
      change: stub(),
    }
    listener = createCallFinishedListener({
      changeContactStatusService: changeContactStatusServiceStub as ChangeContactStatusService,
    })
  })

  it('discards Spanish landline contact on failed call', async () => {
    changeContactStatusServiceStub.change.resolves()

    await listener(testEvt)

    expect(changeContactStatusServiceStub.change).to.have.been.calledWith({
      ownerId: testEvt.ownerId,
      contactId: testEvt.contactId,
      status: 'BAD',
    }, { id: testEvt.callerId })
  })

  it('discards Portuguese landline contact on failed call', async () => {
    changeContactStatusServiceStub.change.resolves()

    await listener({ ...testEvt, phoneNumber: '+3512222222222' })

    expect(changeContactStatusServiceStub.change).to.have.been.calledWith({
      ownerId: testEvt.ownerId,
      contactId: testEvt.contactId,
      status: 'BAD',
    }, { id: testEvt.callerId })
  })

  it('does nothing for not failed calls', async () => {
    await listener({ ...testEvt, status: 'DONE' })

    expect(changeContactStatusServiceStub.change).to.not.have.been.called
  })

  it('does nothing for failed Spanish mobile calls', async () => {
    await listener({ ...testEvt, phoneNumber: '+34666666666' })

    expect(changeContactStatusServiceStub.change).to.not.have.been.called
  })

  it('does nothing for failed Portuguese mobile calls', async () => {
    await listener({ ...testEvt, phoneNumber: '+351999999999' })

    expect(changeContactStatusServiceStub.change).to.not.have.been.called
  })
})
