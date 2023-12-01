import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

interface Deps {
  scheduledEventsRepository: ScheduledEventsRepository
  eventBus: EventPublisher
}

export const updateScheduledCallController = ({
                                                scheduledEventsRepository,
                                                eventBus
                                              }: Deps) =>
  async (req, res) => {
    const id = req.params.id
    const cmd = { ...req.body, createdBy: req.user.id }

    const updatedCall = await scheduledEventsRepository.update(id, cmd)
    await eventBus.publish({
      name: DomainEventCatalog.SCHEDULED_EVENTS__CALL_UPDATED,
      buildingId: updatedCall.event.buildingId,
      userId: req.user.id,
      note: cmd.note,
    })

    res.status(204).send()
  }
