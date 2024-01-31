type EventListener = (event: unknown) => Promise<void>

export interface ListenerRegister {
  name: string,
  subscriber: EventListener
}

export class ListenersRegistry {
  readonly listeners: Record<string, ListenerRegister[]> = {}

  registry (eventName: string, name: string, subscriber: EventListener) {
    if (this.listeners[eventName] === undefined) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push({ name, subscriber })
  }

  listeningTo (eventName: string): ListenerRegister[] {
    return this.listeners[eventName] || []
  }
}
