export class InMemorySyncEventBus {
  constructor () {
    this.subscribers = {}
  }

  publish (event) {
    if (!this.subscribers[ event.name ]) {
      return
    }

    this.subscribers[ event.name ].forEach(sub => {
      sub(event)
    })
  }

  on (eventName, subscriber) {
    if (!this.subscribers[ eventName ]) {
      this.subscribers[ eventName ] = []
    }
    this.subscribers[ eventName ].push(subscriber)
  }
}
