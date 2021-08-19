import { expect } from 'chai'
import { SmsMessagesRepository, SmsOutgoingMessage } from '../../../src/calls/repository/sms-messages.repository'
import { createTestContainer } from '../../create-test-container'
import { isRight } from 'fp-ts/These'
import { Right } from 'fp-ts/Either'
import { outgoingSmsBuilder } from '../outgoing-sms.builder'

describe('SmsMessagesRepository', () => {
  let repository: SmsMessagesRepository
  const testSms: SmsOutgoingMessage = outgoingSmsBuilder()()
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
