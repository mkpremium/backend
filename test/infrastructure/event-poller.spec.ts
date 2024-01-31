import { EventPoller } from '../../src/infrastructure/event-bus/event-poller'
import { stub } from 'sinon'
import { expect } from 'chai'
import { createLoggerMock } from './logger.spec'
import { ListenersRegistry } from '../../src/infrastructure/event-bus/listeners-registry'

describe('EventPoller', () => {
  let eventPoller: EventPoller
  let listenersRegistry: ListenersRegistry
  let sqsClientStub
  let loggerStub
  const testEventsQueueUrl = 'https://sqs.region.aws.com/events-queue.fifo'
  const testEvent = {
    name: 'test_event.name',
    testProperty: 'value'
  }
  const testListenerName = 'test.listener_name'
  const testMessage = {
    ReceiptHandle: 'test-message-receipt-handle',
    Body: JSON.stringify({
      event: testEvent,
      listener: testListenerName
    })
  }

  beforeEach(() => {
    sqsClientStub = {
      receiveMessage: stub().returns({ promise: () => Promise.resolve({ Messages: [testMessage] }) }),
      deleteMessage: stub().returns({ promise: () => Promise.resolve() })
    }
    loggerStub = createLoggerMock()
    listenersRegistry = new ListenersRegistry()

    eventPoller = new EventPoller(
      sqsClientStub,
      listenersRegistry,
      loggerStub,
      testEventsQueueUrl
    )
  })

  it('polls SQS queue for next event with long polling', async () => {
    await eventPoller.poll()

    expect(sqsClientStub.receiveMessage).to.have.been.calledWithMatch({
      QueueUrl: testEventsQueueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20
    })
  })

  it('returns no-event-received outcome when  no event is received', async () => {
    sqsClientStub.receiveMessage.returns({ promise: () => Promise.resolve({ Messages: [] }) })

    const outcome = await eventPoller.poll()

    expect(outcome).to.be.equal('no-event-received')
  })

  it('does remove message and logs an error when cannot get listener', async () => {
    await eventPoller.poll()

    expect(loggerStub.error).to.have.been.called
  })

  it('invokes subscriber', async () => {
    const subscriberStub = stub().resolves()
    listenersRegistry.registry(testEvent.name, testListenerName, subscriberStub)

    await eventPoller.poll()

    expect(subscriberStub).to.have.been.calledWith(testEvent)
  })

  it('removes message after event is correctly processed', async () => {
    const subscriberStub = stub().resolves()
    listenersRegistry.registry(testEvent.name, testListenerName, subscriberStub)

    await eventPoller.poll()

    expect(sqsClientStub.deleteMessage).to.have.been.calledWith({
      QueueUrl: testEventsQueueUrl,
      ReceiptHandle: testMessage.ReceiptHandle
    })
  })
})
