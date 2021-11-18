export class EventNamingPolicy {
  satisfiesEventName (name: string): boolean {
    return false
  }

  satisfiesListenerName (name: string): boolean {
    return false
  }
}
