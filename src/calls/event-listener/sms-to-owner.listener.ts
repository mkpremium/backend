import { CallDone } from '../controller/call-done-webhook.controller'
import { SmsMessageSender } from '../service/sms-message.service'

interface Deps {
  smsMessageSender: SmsMessageSender
}

const mobilePhoneRegexp = /\+346|\+3519/

export const createSmsToOwnerListener = ({ smsMessageSender }: Deps) => {
  return async (evt: CallDone) => {
    if (!mobilePhoneRegexp.test(evt.phoneNumber)) {
      return
    }

    await smsMessageSender.sendMessage(evt)
  }
}
