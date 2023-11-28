import { ALL_EVENTS_LISTENER } from '../event-bus'

export interface EventNamingPolicy {
  satisfiesEventName (name: string): boolean

  satisfiesListenerName (name: string): boolean
}

const eventNamePattern = /(?<module>[a-z_])\.(?<event>[a-z_])/
export const eventNamingPolicy: EventNamingPolicy = {
  satisfiesEventName (name: string): boolean {
    return eventNamePattern.test(name)
  },

  satisfiesListenerName (name: string): boolean {
    return eventNamePattern.test(name) || name === ALL_EVENTS_LISTENER
  }
}
