import { EventEmitter } from 'events'
import { logger } from './logger'

export class EventBus {
  constructor (logger) {
    this.emitter = new EventEmitter()
    this.emitter.on('error', error => {
      logger.crit('error event received', { error })
    })
  }

  publish (event) {
    this.emitter.emit(event.name, event)
  }

  on (eventName, subscriber) {
    this.emitter
      .addListener(eventName, (event) => {
        subscriber(event)
          .catch(error => {
            logger.crit('error processing event', {
              event,
              error: {
                message: error.message ? error.message : error.toString(),
                stack: error.stack ? error.stack : undefined
              }
            })
          })
      })
  }
}
