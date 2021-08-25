import { expect } from 'chai'
import { RequestHandler } from 'express'
import { twilioIncomingCallController } from '../../../src/calls/controller/twilio-incoming-call.controller'
import { stub } from 'sinon'
import { taskEither } from 'fp-ts'

describe('twilioIncomingCallController', () => {
  let controller: RequestHandler
  let incomingCallProcessorStub
  let loggerStub
  let requestStub
  let responseStub
  const testResponseMessage = 'test response message'
  const testTwimlResponse = { toString: () => testResponseMessage }
  const testFromPhoneNumber = '+34666666666'

  beforeEach(() => {
    requestStub = {
      body: {
        From: testFromPhoneNumber,
      }
    }
    responseStub = {
      send: stub(),
      sendStatus: stub(),
    }
    loggerStub = { error: stub() }
    incomingCallProcessorStub = {
      process: stub().returns(taskEither.of(testTwimlResponse)),
    }

    controller = twilioIncomingCallController({
      incomingCallProcessor: incomingCallProcessorStub,
      logger: loggerStub,
    })
  })

  it('replies with processor response', async () => {
    await controller(requestStub, responseStub, undefined)

    expect(incomingCallProcessorStub.process).to.have.been.calledWith({
      from: testFromPhoneNumber,
    })
    expect(responseStub.send).to.be.calledWith(testResponseMessage)
  })

  it('replies with server error when processor fails', async () => {
    incomingCallProcessorStub.process.returns(taskEither.left(new Error('Boom!')))

    await controller(requestStub, responseStub, undefined)

    expect(responseStub.sendStatus).to.have.been.calledWith(500)
    expect(loggerStub.error).to.have.been.called
  })
})
