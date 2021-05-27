import { EventEmitter } from 'events'
import { Logger } from 'winston'
import { logger } from './logger'

export class EventBus {
  private emitter = new EventEmitter()

  get info () {
    const eventNames = this.emitter.eventNames()

    return eventNames.map(name => ({ name, count: this.emitter.listenerCount(name) }))
  }

  constructor (private logger: Logger) {
    this.emitter.setMaxListeners(0)
    this.emitter.on('error', error => {
      logger.crit('error event received', { error })
    })
  }

  publish<T extends { name: string }> (event: T) {
    this.emitter.emit(event.name, event)
  }

  on (eventName: string, subscriber: (event: any) => Promise<any>) {
    this.logger.info('New event subscriber', { eventName })
    this.emitter
      .addListener(eventName, (event) => {
        try {
          subscriber(event)
            .catch(error => {
              this.logSubscriberError(event, eventName, error)
            })
        } catch (error) {
          this.logSubscriberError(event, eventName, error)
        }
      })
  }

  private logSubscriberError (event, eventName, error) {
    this.logger.crit('error processing event', {
      event,
      eventName,
      error: {
        message: error.message ? error.message : error.toString(),
        stack: error.stack ? error.stack : undefined
      }
    })
  }
}
