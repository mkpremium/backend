import { SmsWebhookProcessor } from '../service/sms-webhook.processor'

interface Deps {
  smsWebhookProcessor: SmsWebhookProcessor
}

export function twilioSMSWebhookController ({ smsWebhookProcessor }: Deps) {
  return async function (req, res) {
    const response = await smsWebhookProcessor.process({})()
    res.send(response.toString())
  }
}
