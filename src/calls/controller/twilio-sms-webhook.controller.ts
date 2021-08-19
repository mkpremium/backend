import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'
import { Task } from 'fp-ts/Task'

interface Deps {
  smsWebhookProcessor: {
    process: (cmd: any) => Task<MessagingResponse>
  }
}

export function twilioSMSWebhookController ({ smsWebhookProcessor }: Deps) {
  return async function (req, res) {
    const response = await smsWebhookProcessor.process({})()
    res.send(response.toString())
  }
}
