import { ALL_EVENTS_LISTENER, EventBus } from '../event-bus'
import { Logger } from '../logger'
import { SQS } from 'aws-sdk'
import { SendMessageBatchRequestEntry } from 'aws-sdk/clients/sqs'
import { ListenersRegistry } from './listeners-registry'
import { WrongEventName, WrongListenerName } from './errors'
import { EventNamingPolicy } from './event-naming-policy'

interface SQSEvent {
  name: string,
  messageGroupId?: string,
  messageDeduplicationId?: string
}

export class SqsBus implements EventBus {
  constructor (
    private logger: Logger,
    private sqsClient: SQS,
    private eventsQueueUrl: string,
    private listenersRegistry: ListenersRegistry,
    private eventNamingPolicy: EventNamingPolicy,
  ) {
  }

  get info (): any {
    return this.listenersRegistry.listeners
  }

  on (eventName: string, listenerName: string, subscriber: (event: any) => Promise<any>) {
    if (eventName === ALL_EVENTS_LISTENER) {
      this.listenersRegistry.registry(eventName, listenerName, subscriber)
      return
    }

    this.assertNamingSatisfiesPolicy(listenerName, eventName)

    this.listenersRegistry.registry(eventName, listenerName, subscriber)
  }

  async publish<T extends SQSEvent> (event: T): Promise<void> {
    if (!this.eventNamingPolicy.satisfiesEventName(event.name)) {
      throw new WrongEventName(event.name)
    }

    const allEventsListeners = this.listenersRegistry.listeningTo(ALL_EVENTS_LISTENER)
    const listeners = this.listenersRegistry.listeningTo(event.name).concat(allEventsListeners)
    if (listeners.length === 0) {
      this.logger.warning('No listener for event, not publishing it', event)
      return
    }

    await this.sqsClient.sendMessageBatch({
      QueueUrl: this.eventsQueueUrl,
      Entries: listeners.map(({ name }) => ({
          Id: name.replace('.', '-'),
          // MessageGroupId: event.messageGroupId || uuid(),
          // MessageDeduplicationId: event.messageDeduplicationId || uuid(),
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

  private assertNamingSatisfiesPolicy (listenerName: string, eventName: string) {
    if (!this.eventNamingPolicy.satisfiesListenerName(listenerName)) {
      throw new WrongListenerName(listenerName)
    }
    if (!this.eventNamingPolicy.satisfiesEventName(eventName)) {
      throw new WrongEventName(eventName)
    }
  }
}
