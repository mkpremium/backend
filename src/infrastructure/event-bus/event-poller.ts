import { SQS } from 'aws-sdk'
import { Logger } from '../logger'
import { ListenersRegistry } from './listeners-registry'

export class EventPoller {
  constructor (
    private sqsClient: SQS,
    private listenersRegistry: ListenersRegistry,
    private logger: Logger,
    private eventsQueueUrl: string,
  ) {
  }

  async poll () {
    const { Messages } = await this.sqsClient.receiveMessage({
      QueueUrl: this.eventsQueueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 10,
    }).promise()

    if (Messages.length === 0) {
      this.logger.info('No message received')
      return
    }

    const messageEvent: {
      listener: string,
      event: any,
    } = JSON.parse(Messages[ 0 ].Body)

    const listener = (this.listenersRegistry.listeningTo(messageEvent.event.name) || [])
      .find(({ name }) => name === messageEvent.listener)
    if (!listener) {
      this.logger.error('Subscriber not found', messageEvent)
      return
    }

    await listener.subscriber(messageEvent.event)

    await this.sqsClient.deleteMessage({
      QueueUrl: this.eventsQueueUrl,
      ReceiptHandle: Messages[0].ReceiptHandle,
    })
  }
}
