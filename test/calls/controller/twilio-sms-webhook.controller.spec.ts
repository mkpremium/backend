import { expect } from 'chai'
import { RequestHandler } from 'express'
import { stub } from 'sinon'
import { twilioSMSWebhookController } from '../../../src/calls/controller/twilio-sms-webhook.controller'
import { task, taskEither } from 'fp-ts'

describe('twilio-sms-webhook.controller', () => {
  let controller: RequestHandler
  let smsWebhookProcessorStub
  let requestStub
  let responseStub
  let loggerStub
  const testResponseMessage = 'test response message'
  const testTwimlResponse = { toString: () => testResponseMessage }

  beforeEach(() => {
    requestStub = {
      body: {
        Body: 'owner incoming message',
        From: '+34666666666',
      }
    }
    responseStub = {
      send: stub(),
      sendStatus: stub(),
    }
    smsWebhookProcessorStub = {
      process: stub().returns(taskEither.of(testTwimlResponse)),
    }
    loggerStub = {
      error: stub(),
    }

    controller = twilioSMSWebhookController({
      smsWebhookProcessor: smsWebhookProcessorStub,
      logger: loggerStub,
    })
  })

  it('replies with processor response', async () => {
    await controller(requestStub, responseStub, undefined)

    expect(responseStub.send).to.be.calledWith(testResponseMessage)
  })

  it('fails with server on processor error', async () => {
    smsWebhookProcessorStub.process.returns(taskEither.left(new Error()))

    await controller(requestStub, responseStub, undefined)

    expect(responseStub.sendStatus).to.have.been.calledWith(500)
    expect(loggerStub.error).to.have.been.called
  })
})
