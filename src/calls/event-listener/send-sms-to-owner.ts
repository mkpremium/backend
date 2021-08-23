import { CallDone } from '../controller/call-done-webhook.controller'
import { SendMessageToUnreachedOwnerCodec, SmsMessageSender } from '../service/sms-message.service'
import { isRight } from 'fp-ts/Either'
import { PathReporter } from 'io-ts/PathReporter'

interface Deps {
  smsMessageSender: SmsMessageSender
}

const mobilePhoneRegexp = /\+346|\+3519/

export const sendSmsToOwner = ({ smsMessageSender }: Deps) => {
  return async (evt: CallDone) => {
    if (evt.ownerResponse || evt.status === 'FAILED' || !mobilePhoneRegexp.test(evt.phoneNumber)) {
      return
    }

    // TODO anything missing?
    await smsMessageSender.sendMessageToUnreachedOwner(createCommand(evt))()
  }
}

function createCommand (evt: CallDone) {
  const decoded = SendMessageToUnreachedOwnerCodec.decode({
    to: evt.phoneNumber,
    callerId: evt.callerId,
    contactId: evt.contactId,
    ownerId: evt.ownerId,
    worksheetId: evt.worksheetId,
  })
  if (!isRight(decoded)) {
    throw new Error(PathReporter.report(decoded).join('\n'))
  }

  return decoded.right
}
