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
  });

  [
    [ '+34666666666', 'Spain' ],
    [ '+35199999999', 'Portugal' ],
  ].forEach(([ phoneNumber, country ]) => it(`sends SMS to mobile phone numbers (${country})`, async () => {
    await listener({
      name: 'virtual-caller.call_finished',
      callId: '',
      callerId: '',
      contactId: '',
      ownerId: '',
      ownerResponse: '',
      phoneNumber,
      status: undefined,
      worksheetId: ''
    })

    expect(smsMessageSenderStub.sendMessage).to.have.been.called
  }));

  [
    [ '+34999999', 'Spain' ],
    [ '+35122222', 'Portugal' ],
  ].forEach(([ phoneNumber, country ]) => it(`does not send SMS to landline numbers (${country})`, async () => {
      await listener({
        name: 'virtual-caller.call_finished',
        phoneNumber,
        callId: '',
        callerId: '',
        contactId: '',
        ownerId: '',
        ownerResponse: '',
        status: undefined,
        worksheetId: ''
      })

      expect(smsMessageSenderStub.sendMessage).to.not.have.been.called
    }))

})
