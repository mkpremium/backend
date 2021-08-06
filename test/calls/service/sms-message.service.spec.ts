import { expect } from 'chai'
import { SmsMessageSender } from '../../../src/calls/service/sms-message.service'

describe('SmsMessageSender', () => {
  let service: SmsMessageSender

  beforeEach(() => {
    service = new SmsMessageSender()
  })

  it('works', () => {
    expect(service).to.be.ok
  })
})
