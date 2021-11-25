import { EventBus } from '../event-bus'
import { Logger } from '../logger'
import { SQS } from 'aws-sdk'
import { SendMessageBatchRequestEntry } from 'aws-sdk/clients/sqs'
import uuid from 'uuid/v4'
import { ListenersRegistry } from './listeners-registry'

export class SqsBus implements EventBus {
  private listeners: Record<string, string[]> = {}

  constructor (
    private logger: Logger,
    private sqsClient: SQS,
    private eventsQueueUrl: string,
    private listenersRegistry: ListenersRegistry,
  ) {
  }

  get info (): Record<string, string[]> {
    return this.listeners
  }

  on (eventName: string, subscriberName: string, subscriber: (event: any) => Promise<any>) {
    this.listenersRegistry.registry(eventName, subscriberName, subscriber)
  }

  async publish<T extends { name: string }> (event: T): Promise<void> {
    const listeners = this.listenersRegistry.listeningTo(event.name)
    if (!listeners) {
      this.logger.warning('No listener for event, not publishing it', event)
      return
    }

    await this.sqsClient.sendMessageBatch({
      QueueUrl: this.eventsQueueUrl,
      Entries: listeners.map(({ name }) => ({
          Id: name.replace('.', '-'),
          MessageGroupId: 'events',
          MessageDeduplicationId: uuid(),
          MessageBody: JSON.stringify({ event, listener: name }),
        } as SendMessageBatchRequestEntry)
      )
    }).promise()
      .then((response) => {
        response.Failed.forEach(error => {
          error.SenderFault ?
            this.logger.error('Error sending event into SQS', error) :
            this.logger.warning('Event not saved in SQS', error)
        })
      })
  }
}
