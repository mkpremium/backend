import { expect } from 'chai'
import { SmsWebhookProcessor } from '../../../src/calls/service/sms-webhook.processor'

describe('SmsWebhookProcessor', () => {
  let service: SmsWebhookProcessor

  beforeEach(() => {
    service = new SmsWebhookProcessor()
  })

  it('works', () => {
    expect(service).to.be.ok
  })
})
