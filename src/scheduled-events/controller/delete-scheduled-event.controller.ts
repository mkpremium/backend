import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { SCHEDULED_EVENT_DELETED } from '../controllers'
import { EventPublisher } from '../../infrastructure/event-bus'

const deleteScheduledEvent = (eventBus: EventPublisher) => async (req, res) => {
  const id = req.params.id
  const repo = new ScheduledEventsRepository()
  await repo.delete(id)
  await eventBus.publish({
    id,
    name: SCHEDULED_EVENT_DELETED,
  })
  res.status(204).send()
}

export const createDeleteScheduledEventController = ({ eventBus }) => deleteScheduledEvent(eventBus)
