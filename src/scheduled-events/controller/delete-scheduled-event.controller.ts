import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

interface Deps {
  scheduledEventsRepository: ScheduledEventsRepository
  eventBus: EventPublisher
}

export const deleteScheduledEventControllerFactory = ({ eventBus, scheduledEventsRepository }: Deps) => async (req, res) => {
  const id = req.params.id
  await scheduledEventsRepository.delete(id)
  await eventBus.publish({
    id,
    name: DomainEventCatalog.SCHEDULED_EVENTS__EVENT_DELETED,
  })
  res.status(204).send()
}
