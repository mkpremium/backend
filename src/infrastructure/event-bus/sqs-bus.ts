import { EventBus } from '../event-bus'
import { Logger } from '../logger'
import { SQS } from 'aws-sdk'
import { SendMessageBatchRequestEntry } from 'aws-sdk/clients/sqs'
import uuid from 'uuid/v4'

export class SqsBus implements EventBus {
  private listeners = {}

  constructor (
    private logger: Logger,
    private sqsClient: SQS,
    private eventsQueueUrl: string,
  ) {
  }

  get info (): Record<string, number> {
    return undefined
  }

  on (eventName: string, subscriberName: string) {
    if (this.listeners[ eventName ] === undefined) {
      this.listeners[ eventName ] = []
    }
    this.listeners[ eventName ].push(subscriberName)
  }

  async publish<T extends { name: string }> (event: T): Promise<void> {
    const listeners = this.listeners[ event.name ]
    if (!listeners) {
      this.logger.warning('No listener for event, not publishing it', event)
      return
    }

    await this.sqsClient.sendMessageBatch({
      QueueUrl: this.eventsQueueUrl,
      Entries: listeners.map(listener => ({
          Id: listener.replace('.', '-'),
          MessageGroupId: 'events',
          MessageDeduplicationId: uuid(),
          MessageBody: JSON.stringify({ event, listener }),
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
