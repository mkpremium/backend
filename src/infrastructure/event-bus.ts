export interface EventBus {
  info: Record<string, number>

  publish<T extends { name: string }> (event: T): Promise<void>

  on (eventName: string, subscriber: (event: any) => Promise<any>)
}
