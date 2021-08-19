import { expect } from 'chai'
import { RequestHandler } from 'express'
import { stub } from 'sinon'
import { twilioSMSWebhookController } from '../../../src/calls/controller/twilio-sms-webhook.controller'
import { task } from 'fp-ts'

describe('twilio-sms-webhook.controller', () => {
  let controller: RequestHandler
  let smsWebhookProcessorStub
  let requestStub
  let responseStub
  const testResponseMessage = 'test response message'
  const testTwimlResponse = { toString: () => testResponseMessage }

  beforeEach(() => {
    responseStub = {
      sendStatus: stub(),
      send: stub(),
    }
    smsWebhookProcessorStub = {
      process: stub().returns(task.of(testTwimlResponse)),
    }

    controller = twilioSMSWebhookController({
      smsWebhookProcessor: smsWebhookProcessorStub,
    })
  })

  it('replies with processor response', async () => {
    await controller(requestStub, responseStub, undefined)

    expect(responseStub.send).to.be.calledWith(testResponseMessage)
  })
})
