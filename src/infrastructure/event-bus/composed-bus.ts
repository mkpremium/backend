import { EventBus } from '../event-bus'
import { EventEmitterBus } from './event-emitter-bus'
import { SqsBus } from './sqs-bus'
import { Logger } from '../logger'

export class ComposedBus implements EventBus {
  info: Record<string, number>

  constructor (
    private sqsEventBus: SqsBus,
    private eventEmitterBus: EventEmitterBus,
    private logger: Logger,
  ) {
  }

  on (eventName: string, listenerName: string, subscriber: (event: any) => Promise<any>) {
    this.eventEmitterBus.on(eventName, listenerName, subscriber)
    try {
      this.sqsEventBus.on(eventName, listenerName)
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
