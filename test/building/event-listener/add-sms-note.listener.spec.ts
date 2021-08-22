import { SmsReceived } from '../../../src/calls/service/sms-webhook.processor'
import { addSmsNoteListener } from '../../../src/building/event-listener/add-sms-note.listener'
import { expect } from 'chai'

describe('addSmsNoteListener', () => {
  let listener: (evt: SmsReceived) => Promise<void>

  beforeEach(() => {
    listener = addSmsNoteListener()
  })

  it('works', () => {
    expect(listener).to.be.ok
  })
})
