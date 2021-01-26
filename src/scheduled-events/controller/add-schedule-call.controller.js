import { canScheduleCall } from '../../lib/role-operators'

export const createAddScheduledCallController = ({
  scheduledEventsRepository,
  legacyWorksheetQueueRepository,
  eventBus
}) => async (req, res) => {
  canScheduleCall(req.user.operator, req.body.notifyTo)

  const scheduledEvent = await scheduledEventsRepository.addScheduleCallEvent(req.body, req.user.id)

  const queue = await legacyWorksheetQueueRepository.findByIdOrThrow(req.user.operator.profile.queueId)
  await legacyWorksheetQueueRepository.scheduleWorksheetInQueue(queue, scheduledEvent)

  eventBus.publish({ name: 'scheduled_events.call_scheduled', by: req.user.id })
  res.status(201).json(scheduledEvent)
}
