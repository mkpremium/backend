import { CallDone } from '../controller/call-done-webhook.controller'
import { SmsMessageSender } from '../service/sms-message.service'

interface Deps {
  smsMessageSender: SmsMessageSender
}

export const createSmsToOwnerListener = ({ smsMessageSender }: Deps) => {
  return async (evt: CallDone) => {
    await smsMessageSender.sendMessage(evt)
  }
}
