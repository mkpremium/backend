import { SQS } from 'aws-sdk'
import { Logger } from '../logger'
import { ListenersRegistry } from './listeners-registry'
import { ALL_EVENTS_LISTENER } from '../event-bus'

export class EventPoller {
  private messagesQueue: SQS.Message[] = []

  constructor (
    private sqsClient: SQS,
    private listenersRegistry: ListenersRegistry,
    private logger: Logger,
    private eventsQueueUrl: string,
  ) {
  }

  async poll (): Promise<'event-processed' | 'no-event-received'> {
    const message = await this.nextMessage()
    if (message === 'no-event-received') {
      return 'no-event-received'
    }

    const messageEvent: {
      listener: string,
      event: any,
    } = JSON.parse(message.Body)


    const listener = this.listenersRegistry.listeningTo(messageEvent.event.name)
        .find(({ name }) => name === messageEvent.listener) ||
      this.listenersRegistry.listeningTo(ALL_EVENTS_LISTENER).find(({ name }) => name === messageEvent.listener)
    if (!listener) {
      this.logger.error('Subscriber not found', messageEvent)
      return 'event-processed'
    }

    await listener.subscriber(messageEvent.event)

    await this.sqsClient.deleteMessage({
      QueueUrl: this.eventsQueueUrl,
      ReceiptHandle: message.ReceiptHandle,
    }).promise().catch(error => {
      this.logger.error('Could not delete event', { error: error.message, ...messageEvent })
    })

    return 'event-processed'
  }

  private async nextMessage () {
    if (this.messagesQueue.length === 0) {
      const { Messages } = await this.sqsClient.receiveMessage({
        QueueUrl: this.eventsQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 60,
      }).promise()
      if (!Messages || Messages.length === 0) {
        return 'no-event-received'
      }

      this.messagesQueue = Messages
    }

    return this.messagesQueue.shift()
  }
}
