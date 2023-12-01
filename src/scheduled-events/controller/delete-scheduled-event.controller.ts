import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

const deleteScheduledEvent = (eventBus: EventPublisher) => async (req, res) => {
  const id = req.params.id
  const repo = new ScheduledEventsRepository()
  await repo.delete(id)
  await eventBus.publish({
    id,
    name: DomainEventCatalog.SCHEDULED_EVENTS__EVENT_DELETED,
  })
  res.status(204).send()
}

export const createDeleteScheduledEventController = ({ eventBus }) => deleteScheduledEvent(eventBus)
