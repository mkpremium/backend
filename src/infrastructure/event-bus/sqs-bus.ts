import { EventBus } from '../event-bus'
import { Logger } from '../logger'
import { SQS } from 'aws-sdk'

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

  on (eventName: string, subscriberName: string, subscriber: (event: any) => Promise<any>) {
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
    const eventBody = JSON.stringify(event)

    await this.sqsClient.sendMessageBatch({
      QueueUrl: this.eventsQueueUrl,
      Entries: listeners.map(l => ({
        Id: `${event.name}/${l}`,
        MessageBody: eventBody,
        MessageAttributes: [
          {
            EventName: { StringValue: event.name },
            Listener: { StringValue: l },
          },
        ]
      }))
    }).promise()
  }
}
