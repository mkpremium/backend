import { stub } from 'sinon'
import { CallFinishedProcessor } from '../../../src/calls/service/call-finished.processor'
import { expect } from 'chai'

describe('CallFinishedProcessor', () => {
  let processor: CallFinishedProcessor
  let virtualCallsRepositoryStub
  let eventBusStub
  let loggerStub

  beforeEach(() => {
    virtualCallsRepositoryStub = {
      a: stub(),
    }
    eventBusStub = {
      a: stub(),
    }
    loggerStub = {
      a: stub(),
    }

    processor = new CallFinishedProcessor(
      virtualCallsRepositoryStub,
      eventBusStub,
      loggerStub,
    )
  })

  it('creates', () => {
    expect(processor).to.be.ok
  })
})
