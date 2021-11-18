import { EventEmitter } from 'events'
import { Logger } from 'winston'
import { EventBus } from '../event-bus'
import { WrongEventName, WrongListenerName } from './errors'
import { EventNamingPolicy } from './event-naming-policy'

export class EventEmitterBus implements EventBus {
  private emitter = new EventEmitter()

  get info (): Record<string, number> {
    return this.emitter.eventNames().reduce((acc, name) => {
      acc[ name ] = this.emitter.listenerCount(name)
      return acc
    }, {})
  }

  constructor (
    private logger: Logger,
    private eventNamingPolicy: EventNamingPolicy,
  ) {
    this.emitter.setMaxListeners(0)
    this.emitter.on('error', error => {
      logger.crit('error event received', { error })
    })
  }

  publish<T extends { name: string }> (event: T): Promise<void> {
    if (!this.eventNamingPolicy.satisfiesEventName(event.name)) {
      throw new WrongEventName(event.name)
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

  on (eventName: string, listenerName: string, subscriber: (event: any) => Promise<any>) {
    this.assertNamingSatisfiesPolicy(listenerName, eventName)

    this.logger.info('New event subscriber', { eventName })
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
