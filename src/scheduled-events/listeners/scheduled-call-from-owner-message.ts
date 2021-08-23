import { SmsReceived } from '../../calls/service/sms-webhook.processor'

export function scheduledCallFromOwnerMessage() {
  return async function (evt: SmsReceived) {
  }
}
