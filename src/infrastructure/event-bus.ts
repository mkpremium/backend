import { EntityManager } from 'typeorm'
import { ListenersRegistry } from './event-bus/listeners-registry'

export const ALL_EVENTS_LISTENER = '*'

export interface EventPublisher {
  publish<T extends { name: string }> (event: T, entityManager?: EntityManager): Promise<void>
}

export interface EventListener {
  on (eventName: string, subscriberName: string, subscriber: (event: any) => Promise<any>)
}

export interface EventsDiagnostics {
  info: ListenersRegistry['listeners']
}

export interface EventBus extends EventPublisher, EventListener, EventsDiagnostics {
}
