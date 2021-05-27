import { canScheduleCall } from '../../lib/role-operators'
import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { LegacyWorksheetQueueRepository } from '../../worksheet/models/queue-repository'
import { EventBus } from '../../infrastructure/event-bus'

interface CreateAddScheduledCallControllerDeps {
  scheduledEventsRepository: ScheduledEventsRepository;
  legacyWorksheetQueueRepository: LegacyWorksheetQueueRepository;
  eventBus: EventBus;
}
export const createAddScheduledCallController = ({
  scheduledEventsRepository,
  legacyWorksheetQueueRepository,
  eventBus
}: CreateAddScheduledCallControllerDeps) => async (req, res) => {
  canScheduleCall(req.user.operator, req.body.notifyTo)

  const scheduledEvent = await scheduledEventsRepository.addScheduleCallEvent(req.body, req.user.id)

  const queue = await legacyWorksheetQueueRepository.findByIdOrThrow(req.user.operator.profile.queueId)
  await legacyWorksheetQueueRepository.scheduleWorksheetInQueue(queue, scheduledEvent)

  eventBus.publish({
    name: 'scheduled_events.call_scheduled',
    userId: req.user.id,
    ownerId: req.body.event.ownerId,
    buildingId: req.body.event.buildingId,
    note: req.body.note
  })

  res.status(201).json(scheduledEvent)
}
