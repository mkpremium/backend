import { EventBus } from '../event-bus'
import { ListenersRegistry } from './listeners-registry'

export class InMemorySyncEventBus implements EventBus {
  private subscribers = {}
  info: ListenersRegistry['listeners']

  publish (event): Promise<void> {
    if (!this.subscribers[event.name]) {
      return
    }

    this.subscribers[event.name].forEach(sub => {
      sub(event)
    })
  }

  on (eventName, listenerName, subscriber) {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = []
    }
    this.subscribers[eventName].push(subscriber)
  }
}
