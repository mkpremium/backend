import { canScheduleCall } from '../../lib/role-operators'
import { ScheduleCallService } from '../service/schedule-call.service'
import { ScheduledCallsService } from '../service/scheduled-calls.service'

interface Deps {
  scheduleCall: ScheduleCallService,
  scheduledCallsService: ScheduledCallsService
}

export const createAddScheduledCallController = ({ scheduleCall, scheduledCallsService }: Deps) =>
  async (req, res) => {
    canScheduleCall(req.user.operator, req.body.notifyTo)

    const scheduledEvent = await scheduleCall.scheduleCall({
      event: req.body,
      userId: req.user.id,
      queueId: req.user.operator.profile.queueId
    })

    const fullScheduledEvent = await scheduledCallsService.getById(scheduledEvent.id)

    res.status(201).json(fullScheduledEvent)
  }
