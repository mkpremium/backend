import { expect } from 'chai'
import { SmsWebhookProcessor } from '../../../src/calls/service/sms-webhook.processor'

describe('SmsWebhookProcessor', () => {
  let service: SmsWebhookProcessor

  beforeEach(() => {
    service = new SmsWebhookProcessor()
  })

  ;[
    [ 'Spanish', '+34666666666', 'Perfecto!' ],
    [ 'Portuguese', '+351999999999', 'Perfeito!' ],
  ].forEach(([ lang, fromNumber, expectedMessageFragment ]) =>
    it(`replies with message for owner(${lang})`, async () => {
      const message = await service.process({
        fromNumber,
        message: 'test message'
      })()

      expect(message.toString()).to.contain(expectedMessageFragment)
    }))
})
