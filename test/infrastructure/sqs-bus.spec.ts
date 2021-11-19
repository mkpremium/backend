import { SqsBus } from '../../src/infrastructure/event-bus/sqs-bus'
import { expect } from 'chai'
import { createLoggerMock } from './logger.spec'
import { spy, stub } from 'sinon'
import { test } from 'mocha'

describe('SqsBus', () => {
  let service: SqsBus
  let loggerSpy
  let sqsClientStub
  const testEvent = {
    name: 'source.event_name'
  }
  const testEventsQueueUrl = 'https://sqs.amazonaws.com/test-events-queue'

  beforeEach(() => {
    loggerSpy = createLoggerMock()
    sqsClientStub = {
      sendMessageBatch: stub(),
    }
    sqsClientStub.sendMessageBatch.returns({ promise: () => Promise.resolve() })

    service = new SqsBus(
      loggerSpy,
      sqsClientStub,
      testEventsQueueUrl,
    )
  })

  it('does not publish events without listener', async () => {
    await service.publish(testEvent)

    expect(sqsClientStub.sendMessageBatch).to.not.have.been.called
    expect(loggerSpy.warning).to.have.been.called
  })

  it('puts message in SQS queue', async () => {
    service.on(testEvent.name, 'test.listener', () => undefined)

    await service.publish(testEvent)

    const sendMessagesArg = sqsClientStub.sendMessageBatch.lastCall.firstArg
    expect(sendMessagesArg.QueueUrl).to.be.equal(testEventsQueueUrl)
  })

  it('publishes an event for listener', async () => {
    service.on(testEvent.name, 'test.listener_1', () => undefined)
    service.on(testEvent.name, 'test.listener_2', () => undefined)

    await service.publish(testEvent)

    const sendMessagesArg = sqsClientStub.sendMessageBatch.lastCall.firstArg
    expect(sendMessagesArg.Entries).to.have.lengthOf(2)
    expect(loggerSpy.warning).to.not.have.been.called
  })
})
