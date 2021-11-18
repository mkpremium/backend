import { stub } from 'sinon'
import { CallFinishedProcessor } from '../../../src/calls/service/call-finished.processor'
import { expect } from 'chai'
import { callBuilder } from '../call.builder'

describe('CallFinishedProcessor', () => {
  let processor: CallFinishedProcessor
  let virtualCallsRepositoryStub
  let eventBusStub
  let loggerStub
  const testCmd = {
    twilioCallStatus: 'completed' as 'completed',
    callId: 'test-call-id',
    error: {
      twilioErrorMessage: undefined,
      sipResponseCode: undefined,
      errorCode: undefined,
    }
  }

  beforeEach(() => {
    virtualCallsRepositoryStub = {
      get: stub().resolves(callBuilder().build()),
      save: stub().resolves(),
    }
    eventBusStub = {
      publish: stub(),
    }

    processor = new CallFinishedProcessor(
      virtualCallsRepositoryStub,
      eventBusStub,
      loggerStub,
    )
  })

  it('saves finished call', async () => {
    await processor.process(testCmd)()

    expect(virtualCallsRepositoryStub.save).to.be.called
    expect(virtualCallsRepositoryStub.save.lastCall.firstArg).to.include({ status: 'DONE' })
    expect(virtualCallsRepositoryStub.save.lastCall.firstArg.finishedAt).to.be.not.null
  })

  it('publishes event', async () => {
    await processor.process(testCmd)()

    expect(eventBusStub.publish).to.have.been.called
    expect(eventBusStub.publish.lastCall.firstArg).to.include({
      name: 'virtual_caller.call_finished',
      callId: 'test-call-id',
      status: 'DONE',
    })
  })

  it('saves failure reason', async () => {
    await processor.process({
      ...testCmd, twilioCallStatus: 'failed', error: {
        twilioErrorMessage: 'invalid phone number ',
        sipResponseCode: '404',
        errorCode: '13224',
      }
    })()

    expect(virtualCallsRepositoryStub.save.lastCall.firstArg).to.deep.include({
      status: 'FAILED',
      error: 'phone does not exist',
      errorContext: {
        twilioErrorMessage: 'invalid phone number ',
        sipResponseCode: '404',
        errorCode: '13224',
      }
    })
  })
})
