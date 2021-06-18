import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { LegacyWorksheetQueueRepository } from '../../worksheet/models/queue-repository'
import { EventBus } from '../../infrastructure/event-bus'
import { ScheduledEventProps } from '../types'

export interface ScheduleCallCommand {
  event: ScheduledEventProps & { note: string },
  userId: string,
  queueId: string
}

export class ScheduleCallService {
  constructor (
    private scheduledEventsRepository: ScheduledEventsRepository,
    private legacyWorksheetQueueRepository: LegacyWorksheetQueueRepository,
    private eventBus: EventBus,
  ) {
  }

  async scheduleCall (cmd: ScheduleCallCommand) {
    const scheduledEvent = await this.scheduledEventsRepository.addScheduleCallEvent(cmd.event, cmd.userId)

    const queue = await this.legacyWorksheetQueueRepository.findByIdOrThrow(cmd.queueId)
    await this.legacyWorksheetQueueRepository.scheduleWorksheetInQueue(queue, scheduledEvent)

    await this.eventBus.publish({
      name: 'scheduled_events.call_scheduled',
      userId: cmd.userId,
      ownerId: cmd.event.event.ownerId,
      buildingId: cmd.event.event.buildingId,
      note: cmd.event.note
    })

    return scheduledEvent
  }
}
