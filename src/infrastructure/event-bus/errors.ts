export class WrongEventName extends Error {
  constructor (readonly eventName: string) {
    super(`Wrong event name provided (${eventName})`)
  }
}

export class WrongListenerName extends Error {
  constructor (readonly listenerName: string) {
    super(`Wrong event name provided (${listenerName})`)
  }
}
