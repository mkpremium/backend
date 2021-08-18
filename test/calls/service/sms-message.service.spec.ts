import { expect } from 'chai'
import { stub } from 'sinon'
import { SmsMessageSender } from '../../../src/calls/service/sms-message.service'

describe('SmsMessageSender', () => {
  let service: SmsMessageSender
  let twilioClientStub
  let testPublicUrl = 'https://api.mkpremium.net'
  const testCmd = {
    to: '',
    callId: '',
    callerId: '',
    contactId: '',
    ownerId: '',
    worksheetId: '',
  }

  beforeEach(() => {
    twilioClientStub = {
      messages: {
        create: stub().resolves(),
      }
    }
    service = new SmsMessageSender(
      twilioClientStub,
      testPublicUrl
    )
  })

  it('sends Spanish message to Spain numbers', async () => {
    await service.sendMessageToUnreachedOwner({ ...testCmd, to: '+34666666666' })

    expect(twilioClientStub.messages.create).to.have.been.calledWithMatch(({ body }) => body.startsWith('Hola,'))
  })

  it('sends Portuguese message to Portugal numbers', async () => {
    await service.sendMessageToUnreachedOwner({ ...testCmd, to: '+351999999999' })

    expect(twilioClientStub.messages.create).to.have.been.calledWithMatch(({ body }) => body.startsWith('Olá,'))
  })
})
