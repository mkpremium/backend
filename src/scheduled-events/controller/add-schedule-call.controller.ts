import { canScheduleCall } from '../../lib/role-operators'
import { ScheduleCallService } from '../service/schedule-call.service'

export const createAddScheduledCallController = ({ scheduleCall }: { scheduleCall: ScheduleCallService }) =>
  async (req, res) => {
    canScheduleCall(req.user.operator, req.body.notifyTo)

    const scheduledEvent = await scheduleCall.scheduleCall({
      event: req.body,
      userId: req.user.id,
      queueId: req.user.operator.profile.queueId,
    })

    res.status(201).json(scheduledEvent)
  }
