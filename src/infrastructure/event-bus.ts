import { EventEmitter } from 'events'
import { Logger } from 'winston'

export class EventBus {
  private emitter = new EventEmitter()

  constructor (private logger: Logger) {
    this.emitter.on('error', error => {
      logger.crit('error event received', { error })
    })
  }

  publish<T extends { name: string }> (event: T) {
    this.emitter.emit(event.name, event)
  }

  on (eventName: string, subscriber: (event: any) => Promise<any>) {
    this.emitter
      .addListener(eventName, (event) => {
        try {
          subscriber(event)
            .catch(error => {
              logSubscriberError(event, eventName, error)
            })
        } catch (error) {
          logSubscriberError(event, eventName, error)
        }
      })
  }
}

function logSubscriberError (event, eventName, error) {
  this.logger.crit('error processing event', {
    event,
    eventName,
    error: {
      message: error.message ? error.message : error.toString(),
      stack: error.stack ? error.stack : undefined
    }
  })
}
