import { EventEmitter } from 'events'
import { Logger } from 'winston'
import { ALL_EVENTS_LISTENER, EventBus } from '../event-bus'
import { WrongEventName, WrongListenerName } from './errors'
import { EventNamingPolicy } from './event-naming-policy'
import { EntityManager } from 'typeorm'
import type { ListenersRegistry } from './listeners-registry'
import { DomainEvent, DomainEventCatalog } from '../postgres/domain-event.entity'

export class EventEmitterBus implements EventBus {
  private emitter = new EventEmitter()

  get info (): ListenersRegistry['listeners'] {
    return this.emitter.eventNames().reduce((acc, name) => {
      acc[name] = this.emitter.listenerCount(name)
      return acc
    }, {})
  }

  constructor (
    private logger: Logger,
    private eventNamingPolicy: EventNamingPolicy
  ) {
    this.emitter.setMaxListeners(0)
    this.emitter.on('error', error => {
      logger.crit('error event received', { error })
    })
  }

  async publish<T extends { name: string }> (event: T, entityManager?: EntityManager): Promise<void> {
    if (!this.eventNamingPolicy.satisfiesEventName(event.name)) {
      throw new WrongEventName(event.name)
    }

    // The only listener to all events is the event recorder. When the entity manager is provided, want the event to
    // be persisted within the same transaction as the rest of the business logic.
    if (entityManager) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      await entityManager.save(DomainEvent, {
        name: event.name as DomainEventCatalog,
        version: event.name || 'unknown',
        body: { ...event, _meta: { isTransactional: true } }
      })
    }

    return new Promise((resolve, reject) => {
      try {
        this.emitter.emit(event.name, event)
        return resolve()
      } catch (error) {
        return reject(error)
      }
    })
  }

  on (eventName: string, listenerName: string, subscriber: (event: unknown) => Promise<void>) {
    if (eventName !== ALL_EVENTS_LISTENER) {
      this.assertNamingSatisfiesPolicy(listenerName, eventName)
    }

    this.emitter
      .addListener(eventName, (event) => {
        try {
          subscriber(event)
            .catch(error => {
              this.logSubscriberError(event, eventName, error, subscriber)
            })
        } catch (error) {
          this.logSubscriberError(event, eventName, error, subscriber)
        }
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

  private logSubscriberError (event, eventName, error, subscriber) {
    this.logger.crit('error processing event', {
      event,
      eventName,
      subscriber: subscriber.name || subscriber.toString(),
      error: {
        message: error.message ? error.message : error.toString(),
        stack: error.stack ? error.stack : undefined
      }
    })
  }
}
