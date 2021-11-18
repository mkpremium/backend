export interface EventPublisher {
  publish<T extends { name: string }> (event: T): Promise<void>
}

export interface EventListener {
  on (eventName: string, subscriberName: string, subscriber: (event: any) => Promise<any>)
}

export interface EventsDiagnostics {
  info: Record<string, number>
}

export interface EventBus extends EventPublisher, EventListener, EventsDiagnostics {
}
