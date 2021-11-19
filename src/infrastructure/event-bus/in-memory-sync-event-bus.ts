import { EventBus } from '../event-bus'

export class InMemorySyncEventBus implements EventBus {
  private subscribers = {}
  info: Record<string, number>


  publish (event): Promise<void> {
    if (!this.subscribers[ event.name ]) {
      return
    }

    this.subscribers[ event.name ].forEach(sub => {
      sub(event)
    })
  }

  on (eventName, listenerName, subscriber) {
    if (!this.subscribers[ eventName ]) {
      this.subscribers[ eventName ] = []
    }
    this.subscribers[ eventName ].push(subscriber)
  }
}
