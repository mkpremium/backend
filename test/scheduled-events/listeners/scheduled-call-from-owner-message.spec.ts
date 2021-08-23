import { expect } from 'chai'
import { SmsReceived } from '../../../src/calls/service/sms-webhook.processor'
import { scheduledCallFromOwnerMessage } from '../../../src/scheduled-events/listeners/scheduled-call-from-owner-message'

describe('scheduledCallFromOwnerMessage', () => {
  let listener: (evt: SmsReceived) => Promise<void>

  beforeEach(() => {
    listener = scheduledCallFromOwnerMessage()
  })

  it('works', () => {
    expect(listener).to.be.ok
  })
})
