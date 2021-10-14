import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { EventBus } from '../../infrastructure/event-bus'

interface Deps {
  scheduledEventsRepository: ScheduledEventsRepository
  eventBus: EventBus
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
      name: 'scheduled_events.call_updated',
      buildingId: updatedCall.event.buildingId,
      userId: req.user.id,
      note: cmd.note,
    })

    res.status(204).send()
  }
