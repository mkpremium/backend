import { EventsRepository } from '../postgres/events.repository'
import type { DomainEvent } from '../postgres/events.repository'

export function createEventRecorderListener ({ eventsRepository }: { eventsRepository: EventsRepository }) {
  return async (event: DomainEvent) => {
    await eventsRepository.saveEvent(event)
  }
}
