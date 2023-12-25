import { ScheduledEventsRepository } from '../repository/schedule-events.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { ScheduledEventProps } from '../types'
import { WorksheetRepository } from '../../worksheet/repository/worksheet.repository'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { WorksheetQueueRepository } from '../../worksheet/repository/worksheet-queue.repository'

export interface ScheduleCallCommand {
  event: ScheduledEventProps & { note: string }
  userId: string
  queueId: string
}

export interface CallScheduled {
  name: DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED
  userId: string
  ownerId: string
  contactId: string
  buildingId: string
  note: string
}

export class ScheduleCallService {
  constructor (
    private scheduledEventsRepository: ScheduledEventsRepository,
    private worksheetQueueRepository: WorksheetQueueRepository,
    private worksheetRepository: WorksheetRepository,
    private eventBus: EventPublisher,
  ) {
  }

  async scheduleCall (cmd: ScheduleCallCommand) {
    const worksheet = await this.worksheetRepository.ofBuildingId(cmd.event.event.buildingId)
    cmd.event.event.worksheetId = worksheet.id
    const scheduledEvent = await this.scheduledEventsRepository.addScheduleCallEvent(cmd.event, cmd.userId)

    const queue = await this.worksheetQueueRepository.get(cmd.queueId)
    await this.worksheetQueueRepository.scheduleWorksheetInQueue(queue, scheduledEvent)

    await this.eventBus.publish({
      name: DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED,
      userId: cmd.userId,
      ownerId: cmd.event.event.ownerId,
      contactId: cmd.event.event.contactId,
      buildingId: cmd.event.event.buildingId,
      note: cmd.event.note
    } as CallScheduled)

    return scheduledEvent
  }
}
