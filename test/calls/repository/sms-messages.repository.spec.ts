import { expect } from 'chai'
import { SmsMessagesRepository, SmsOutgoingMessage } from '../../../src/calls/repository/sms-messages.repository'
import { createTestContainer } from '../../create-test-container'
import { isRight } from 'fp-ts/These'
import { Right } from 'fp-ts/Either'
import { outgoingSmsBuilder } from '../outgoing-sms.builder'

describe('SmsMessagesRepository', () => {
  let repository: SmsMessagesRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('smsMessagesRepository')
  })

  it('saves new SMS into DB', async () => {
    const testSms = outgoingSmsBuilder()()
    await repository.addOutgoing(testSms)()

    const savedSms = await repository.getOutgoingSms(testSms.id)()

    expect(isRight(savedSms)).to.be.true
    expect((savedSms as Right<SmsOutgoingMessage>).right).to.deep.include(testSms)
  })

  it('returns last message sent to number', async () => {
    const testPhone = '+34666666666'
    await repository.addOutgoing(outgoingSmsBuilder({ id: 'first-message', createdAt: new Date().toISOString(), to: testPhone })())()
    await repository.addOutgoing(outgoingSmsBuilder({ id: 'second-message', createdAt: new Date().toISOString(), to: testPhone })())()

    const lastMessage = await repository.lastSentTo(testPhone)()

    expect((lastMessage as Right<SmsOutgoingMessage>).right.id)
      .to.be.equal('second-message')
  })
})
