import { SqsBus } from '../../src/infrastructure/event-bus/sqs-bus'
import { expect } from 'chai'
import { createLoggerMock } from './logger.spec'
import { stub } from 'sinon'
import { ListenersRegistry } from '../../src/infrastructure/event-bus/listeners-registry'
import { eventNamingPolicy } from '../../src/infrastructure/event-bus/event-naming-policy'

describe.skip('SqsBus', () => {
  let service: SqsBus
  let loggerStub
  let sqsClientStub
  const testEvent = {
    name: 'source.event_name'
  }
  const testEventsQueueUrl = 'https://sqs.amazonaws.com/test-events-queue'
  const noopListener = () => undefined

  beforeEach(() => {
    loggerStub = createLoggerMock()
    sqsClientStub = {
      sendMessageBatch: stub().returns({ promise: () => Promise.resolve({ Successful: [], Failed: [] }) })
    }

    service = new SqsBus(
      loggerStub,
      sqsClientStub,
      testEventsQueueUrl,
      new ListenersRegistry(),
      eventNamingPolicy,
      null
    )
  })

  it('does not publish events without listener', async () => {
    await service.publish(testEvent)

    expect(sqsClientStub.sendMessageBatch).to.not.have.been.called
    expect(loggerStub.warning).to.have.been.called
  })

  it('puts message in SQS queue', async () => {
    service.on(testEvent.name, 'test.listener', noopListener)

    await service.publish(testEvent)

    const sendMessagesArg = sqsClientStub.sendMessageBatch.lastCall.firstArg
    expect(sendMessagesArg.QueueUrl).to.be.equal(testEventsQueueUrl)
  })

  it('publishes an event for listener', async () => {
    service.on(testEvent.name, 'test.listener_1', noopListener)
    service.on(testEvent.name, 'test.listener_2', noopListener)

    await service.publish(testEvent)

    const sendMessagesArg = sqsClientStub.sendMessageBatch.lastCall.firstArg
    expect(sendMessagesArg.Entries).to.have.lengthOf(2)
    expect(loggerStub.warning).to.not.have.been.called
  })

  it('publishes all events to broadcast listener', async () => {
    service.on('*', 'test.listener_1', noopListener)

    await service.publish(testEvent)
    await service.publish({ name: 'test.other_event' })

    expect(sqsClientStub.sendMessageBatch).to.have.been.calledTwice
  })

  const sqsErrorResponse = {
    Id: `${testEvent.name}/test.listener`,
    SenderFault: true,
    Code: 'abc',
    Message: 'Server error'
  }

  it('logs warning when message is wrong', async () => {
    service.on(testEvent.name, 'test.listener', noopListener)
    sqsClientStub.sendMessageBatch.returns({
      promise: () => Promise.resolve({
        Failed: [{
          ...sqsErrorResponse,
          SenderFault: false
        }]
      })
    })

    await service.publish(testEvent)

    expect(loggerStub.warning).to.have.been.called
  })

  it('logs error when message is not stored', async () => {
    service.on(testEvent.name, 'test.listener', noopListener)
    sqsClientStub.sendMessageBatch.returns({
      promise: () => Promise.resolve({
        Failed: [{
          ...sqsErrorResponse,
          SenderFault: true
        }]
      })
    })

    await service.publish(testEvent)

    expect(loggerStub.error).to.have.been.called
  })
})
