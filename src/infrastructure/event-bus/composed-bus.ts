import { EventBus } from '../event-bus'
import { EventEmitterBus } from './event-emitter-bus'
import { SqsBus } from './sqs-bus'
import { Logger } from '../logger'

export class ComposedBus implements EventBus {
  get info (): any {
    return {
      eventEmitter: this.eventEmitterBus.info,
      sqs: this.sqsEventBus.info
    }
  }

  constructor (
    private sqsEventBus: SqsBus,
    private eventEmitterBus: EventEmitterBus,
    private logger: Logger
  ) {
  }

  on (eventName: string, listenerName: string, subscriber: (event: unknown) => Promise<void>) {
    this.eventEmitterBus.on(eventName, listenerName, subscriber)
    try {
      this.sqsEventBus.on(eventName, listenerName, subscriber)
    } catch (error) {
      this.logger.error('Error registering listener in SQS bus', { eventName, listenerName, error: error.message })
    }
  }

  publish<T extends { name: string }> (event: T): Promise<void> {
    this.sqsEventBus.publish(event)
      .catch((error) => this.logger.error('Error publishing event in SQS bus', { event, error: error.message }))

    return this.eventEmitterBus.publish(event)
  }
}
