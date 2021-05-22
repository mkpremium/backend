import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { SCHEDULED_EVENT_DELETED } from '../controllers'

class ScheduledEventDeleted {
  constructor (id) {
    this.id = id
    this.name = SCHEDULED_EVENT_DELETED
  }
}

const deleteScheduledEvent = eventBus => async (req, res) => {
  const id = req.params.id
  const repo = new ScheduledEventsRepository()
  await repo.delete(id)
  eventBus.publish(new ScheduledEventDeleted(id))
  res.status(204).send()
}

export const createDeleteScheduledEventController = ({ eventBus }) => deleteScheduledEvent(eventBus)
