import { expect } from 'chai'
import { SmsMessagesRepository } from '../../../src/calls/repository/sms-messages.repository'
import { createTestContainer } from '../../create-test-container'

describe.only('SmsMessagesRepository', () => {
  let repository: SmsMessagesRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('smsMessagesRepository')
  })

  it('works', () => {
    expect(repository).to.be.ok
  })
})
