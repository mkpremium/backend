import { SmsWebhookProcessor } from '../service/sms-webhook.processor'
import { isRight } from 'fp-ts/Either'

interface Deps {
  smsWebhookProcessor: SmsWebhookProcessor
}

export function twilioSMSWebhookController ({ smsWebhookProcessor }: Deps) {
  return async function (req, res) {
    const { Body, From } = req.body
    const response = await smsWebhookProcessor.process({
      fromNumber: From,
      message: Body,
    })()

    if (isRight(response)) {
      res.send(response.right.toString())
    } else {
      res.sendStatus(500)
    }
  }
}
