import { expect } from 'chai'
import { stub } from 'sinon'
import { CallDone } from '../../../src/calls/controller/call-done-webhook.controller'
import { createSmsToOwnerListener } from '../../../src/calls/event-listener/sms-to-owner.listener'

describe('sms-to-owner.listener', () => {
  let listener: (evt: CallDone) => Promise<void>
  let smsMessageSenderStub

  beforeEach(() => {
    smsMessageSenderStub = {
      sendMessage: stub(),
    }
    listener = createSmsToOwnerListener({ smsMessageSender: smsMessageSenderStub })
  })

  it('invokes SMS message sender', async () => {
    await listener({
      name: 'virtual-caller.call_finished',
      callId: '',
      callerId: '',
      contactId: '',
      ownerId: '',
      ownerResponse: '',
      phoneNumber: '',
      status: undefined,
      worksheetId: ''
    })

    expect(smsMessageSenderStub.sendMessage).to.have.been.called
  })
})
