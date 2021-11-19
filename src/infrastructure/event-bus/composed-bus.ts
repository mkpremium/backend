import { EventBus } from '../event-bus'
import { EventEmitterBus } from './event-emitter-bus'
import { SqsBus } from './sqs-bus'

export class ComposedBus implements EventBus {
  info: Record<string, number>

  constructor (
    private sqsEventBus: SqsBus,
    private eventEmitterBus: EventEmitterBus
  ) {
  }

  on (eventName: string, subscriberName: string, subscriber: (event: any) => Promise<any>) {
  }

  publish<T extends { name: string }> (event: T): Promise<void> {
    return Promise.resolve(undefined)
  }
}
