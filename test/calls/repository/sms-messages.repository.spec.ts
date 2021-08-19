import { expect } from 'chai'
import { SmsMessagesRepository, SmsOutgoingMessage } from '../../../src/calls/repository/sms-messages.repository'
import { createTestContainer } from '../../create-test-container'
import { isRight } from 'fp-ts/These'
import { Right } from 'fp-ts/Either'

describe('SmsMessagesRepository', () => {
  let repository: SmsMessagesRepository
  const testSms: SmsOutgoingMessage = {
    id: 'test-outgoing-sms-id',
    callerId: 'test-caller-id',
    contactId: 'test-contact-id',
    createdAt: new Date(),
    ownerId: 'test-owner-id',
    worksheetId: 'test-worksheet-id',
  }

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('smsMessagesRepository')

  })

  it('saves new SMS into DB', async () => {
    await repository.addOutgoing(testSms)()

    const savedSms = await repository.getOutgoingSms(testSms.id)()

    expect(isRight(savedSms)).to.be.true
    expect((savedSms as Right<SmsOutgoingMessage>).right).to.deep.include(testSms)
  })
})
