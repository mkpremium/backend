import { ALL_EVENTS_LISTENER, EventBus } from '../event-bus'
import { Logger } from '../logger'
import { SQS } from 'aws-sdk'
import { SendMessageBatchRequestEntry } from 'aws-sdk/clients/sqs'
import { ListenerRegister, ListenersRegistry } from './listeners-registry'
import { WrongEventName, WrongListenerName } from './errors'
import { EventNamingPolicy } from './event-naming-policy'
import { EntityManager } from 'typeorm'
import { createEventRecorderListener } from './event-recorder.listener'

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
    private eventRecorderListener: ReturnType<typeof createEventRecorderListener>
  ) {
  }

  get info (): ListenersRegistry['listeners'] {
    return this.listenersRegistry.listeners
  }

  on (eventName: string, listenerName: string, subscriber: (event: unknown) => Promise<void>) {
    if (eventName === ALL_EVENTS_LISTENER) {
      this.listenersRegistry.registry(eventName, listenerName, subscriber)
      return
    }

    this.assertNamingSatisfiesPolicy(listenerName, eventName)

    this.listenersRegistry.registry(eventName, listenerName, subscriber)
  }

  async publish<T extends SQSEvent> (event: T, entityManager?: EntityManager): Promise<void> {
    if (!this.eventNamingPolicy.satisfiesEventName(event.name)) {
      throw new WrongEventName(event.name)
    }

    let allEventsListeners: [ListenerRegister] | []
    // The only listener to all events is the event recorder. When the entity manager is provided, want the event to
    // be persisted within the same transaction as the rest of the business logic.
    if (entityManager) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      await this.eventRecorderListener(event as any, entityManager, true)
      allEventsListeners = []
    } else {
      allEventsListeners = this.listenersRegistry.listeningTo(ALL_EVENTS_LISTENER) as [ListenerRegister]
    }

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
        MessageBody: JSON.stringify({ event, listener: name })
      } as SendMessageBatchRequestEntry)
      )
    }).promise()
      .then((response) => {
        response.Failed.forEach(error => {
          error.SenderFault
            ? this.logger.error('Error sending event into SQS', error)
            : this.logger.warning('Event not saved in SQS', error)
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
