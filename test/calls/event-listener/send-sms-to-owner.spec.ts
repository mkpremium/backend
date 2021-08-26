import { expect } from 'chai'
import { stub } from 'sinon'
import { sendSmsToOwner } from '../../../src/calls/event-listener/send-sms-to-owner'
import { OwnerResponse } from '../../../src/calls/service/owner-response-processor.service'
import { taskEither } from 'fp-ts'
import { CallDone } from '../../../src/calls/service/call-finished.processor'

describe('sms-to-owner.listener', () => {
  let listener: (evt: CallDone) => Promise<void>
  let smsMessageSenderStub
  const testEvt: CallDone = {
    name: 'virtual-caller.call_finished',
    callId: 'test-call-id',
    callerId: 'test-caller-id',
    contactId: 'test-contact-id',
    ownerId: 'test-owner-id',
    ownerResponse: undefined,
    phoneNumber: '+34666666666',
    status: 'DONE',
    worksheetId: 'test-worksheet-id'
  }


  beforeEach(() => {
    smsMessageSenderStub = {
      sendMessageToUnreachedOwner: stub().returns(taskEither.of(undefined)),
    }
    listener = sendSmsToOwner({
      smsMessageSender: smsMessageSenderStub,
    })
  });

  [
    [ '+34666666666', 'Spain' ],
    [ '+35199999999', 'Portugal' ],
  ].forEach(([ phoneNumber, country ]) => it(`sends SMS to mobile phone numbers (${country})`, async () => {
    await listener({ ...testEvt, phoneNumber } )

    expect(smsMessageSenderStub.sendMessageToUnreachedOwner).to.have.been.calledWith({
      to: phoneNumber,
      callerId: testEvt.callerId,
      contactId: testEvt.contactId,
      ownerId: testEvt.ownerId,
      worksheetId: testEvt.worksheetId,
    })
  }));

  [
    [ '+34999999', 'Spain' ],
    [ '+35122222', 'Portugal' ],
  ].forEach(([ phoneNumber, country ]) => it(`does not send SMS to landline numbers (${country})`, async () => {
    await listener({
      ...testEvt,
      phoneNumber,
    })

    expect(smsMessageSenderStub.sendMessageToUnreachedOwner).to.not.have.been.called
  }))

  it('does not send messages when owner has replied', async () => {
    await listener({
      ...testEvt,
      ownerResponse: OwnerResponse.NO_SALE,
    })

    expect(smsMessageSenderStub.sendMessageToUnreachedOwner).to.not.have.been.called
  })

  it('does not send messages for failed calls', async () => {
    await listener({
      ...testEvt,
      status: 'FAILED',
    })

    expect(smsMessageSenderStub.sendMessageToUnreachedOwner).to.not.have.been.called
  })
})
