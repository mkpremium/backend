import { SmsReceived } from '../../calls/service/sms-webhook.processor'

export function addSmsNoteListener() {
  return async function (evt: SmsReceived): Promise<void> {
  }
}
