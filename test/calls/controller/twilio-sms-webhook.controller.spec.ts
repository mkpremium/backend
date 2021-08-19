import { expect } from 'chai'
import { RequestHandler } from 'express'
import { twilioSMSWebhookController } from '../../../src/calls/controller/twilio-sms-webhook.controller'

describe('twilio-sms-webhook.controller', () => {
  let controller: RequestHandler
  // let requestStub
  // let responseStub

  beforeEach(() => {
    controller = twilioSMSWebhookController()
  })

  it('works', () => {
    expect(controller).to.be.ok
  })

  // it('replies with processor response', () => {
  //   controller(requestStub, responseStub, undefined)
  // })
})
