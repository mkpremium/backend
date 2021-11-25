type EventListener = (event: any) => Promise<any>

interface ListenerRegister {
  name: string,
  subscriber: EventListener
}

export class ListenersRegistry {
  private listeners: Record<string, ListenerRegister[]> = {}

  registry (eventName: string, name: string, subscriber: EventListener) {
    if (this.listeners[ eventName ] === undefined) {
      this.listeners[ eventName ] = []
    }
    this.listeners[ eventName ].push({ name, subscriber })
  }

  listeningTo (eventName: string): ListenerRegister[] | undefined {
    return this.listeners[eventName]
  }
}
