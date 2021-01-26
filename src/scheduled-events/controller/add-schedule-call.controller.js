import { ScheduledEventsRepository } from '../repository/ScheduleEventsRepository'
import { LegacyWorksheetQueueRepository } from '../../worksheet/models/queue-repository'
import { canScheduleCall } from '../../lib/role-operators'
import { OperatorStats } from '../../stats/models'
import { OperatorActions } from '../../stats/types'

export async function addScheduledCallEvent (req, res) {
  const repo = new ScheduledEventsRepository()
  const queueRepo = new LegacyWorksheetQueueRepository()

  canScheduleCall(req.user.operator, req.body.notifyTo)

  const scheduledEvent = await repo.addScheduleCallEvent(req.body, req.user.id)

  const queue = await queueRepo.findByIdOrThrow(req.user.operator.profile.queueId)
  await queueRepo.scheduleWorksheetInQueue(queue, scheduledEvent)

  await OperatorStats.registerAction(req.user.id, OperatorActions.SCHEDULE_CALL)
  res.status(201).json(scheduledEvent)
}

export const createAddScheduledCallEventController = () => addScheduledCallEvent
