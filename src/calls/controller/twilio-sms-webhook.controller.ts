import { SmsWebhookProcessor } from '../service/sms-webhook.processor'

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
    res.send(response.toString())
  }
}
