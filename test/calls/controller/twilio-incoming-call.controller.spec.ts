import { expect } from 'chai'
import { RequestHandler } from 'express'
import { twilioIncomingCallController } from '../../../src/calls/controller/twilio-incoming-call.controller'

describe('twilioIncomingCallController', () => {
  let controller: RequestHandler

  beforeEach(() => {
    controller = twilioIncomingCallController()
  })

  it('creates', () => {
    expect(controller).to.be.ok
  })
})
