import { SmsOutgoingMessageCodec } from '../../src/calls/repository/sms-messages.repository'
import { isRight } from 'fp-ts/Either'
import { PathReporter } from 'io-ts/PathReporter'

const prototype = {
  id: 'test-outgoing-sms-id',
  callerId: 'test-caller-id',
  contactId: 'test-contact-id',
  createdAt: new Date().toISOString(),
  ownerId: 'test-owner-id',
  worksheetId: 'test-worksheet-id',
  to: '+34666666666',
}

export function outgoingSmsBuilder(overrides = {}) {
  return function() {
    const outgoingSms = SmsOutgoingMessageCodec.decode({...prototype, ...overrides})
    if (!isRight(outgoingSms)) {
      throw new Error(`Invlidad OutgoingSMS: ${PathReporter.report(outgoingSms)}`)
    }

    return outgoingSms.right
  }
}
