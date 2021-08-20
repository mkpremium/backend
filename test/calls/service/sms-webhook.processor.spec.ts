import { expect } from 'chai'
import { SmsWebhookProcessor } from '../../../src/calls/service/sms-webhook.processor'
import { isRight, Right } from 'fp-ts/Either'
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'

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

      expect(isRight(message)).to.be.true
      expect((message as Right<MessagingResponse>).right.toString())
        .to.contain(expectedMessageFragment)
    }))
})
