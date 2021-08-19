import { Task } from 'fp-ts/Task'
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'

export class SmsWebhookProcessor {
  process (cmd: any): Task<MessagingResponse> {
    throw new Error('Not implemented')
  }
}
