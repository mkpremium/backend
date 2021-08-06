import { expect } from 'chai'
import { CallDone } from '../../../src/calls/controller/call-done-webhook.controller'
import { createSmsToOwnerListener } from '../../../src/calls/event-listener/sms-to-owner.listener'

describe('sms-to-owner.listener', () => {
  let listener: (evt: CallDone) => Promise < void >

  beforeEach(() => {
    listener = createSmsToOwnerListener({})
  })

  it('works', () => {
    expect(listener).to.be.ok
  })
})
