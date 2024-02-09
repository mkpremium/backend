import { EventPublisher } from '../../infrastructure/event-bus'
import type { CallScheduledProps, ScheduledEventProps } from '../types'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { DataSource } from 'typeorm'
import { ScheduledEvent } from '../scheduled-event.entity'
import { toScheduledEventProps } from '../repository/postgres-schedule-events.repository'

export interface ScheduleCallCommand {
  event: Omit<CallScheduledProps, 'id' | 'type' | 'createdAt' | 'createdBy'> & {
    note: string
    eventDate: string
    createdAt?: Date
    createdBy?: string
  }
  userId: string
  queueId?: string
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
    private eventBus: EventPublisher,
    private ormDataSource: DataSource
  ) {
  }

  async scheduleCall (cmd: ScheduleCallCommand): Promise<ScheduledEventProps> {
    return this.doPostgres(cmd)
  }

  private async doPostgres (cmd: ScheduleCallCommand): Promise<ScheduledEventProps> {
    const savedEntity = await this.ormDataSource.manager.save(ScheduledEvent, {
      type: 'CALL',
      scheduledFor: cmd.event.eventDate,
      notifyTo: { id: cmd.event.notifyTo },
      createdBy: { id: cmd.userId },
      building: { id: cmd.event.event.buildingId },
      contact: { id: cmd.event.event.contactId },
      owner: { id: cmd.event.event.ownerId }
    }) as ScheduledEvent

    await this.publishCallScheduledEvent(cmd)

    return toScheduledEventProps(savedEntity)
  }

  private async publishCallScheduledEvent (cmd: ScheduleCallCommand) {
    await this.eventBus.publish({
      name: DomainEventCatalog.SCHEDULED_EVENTS__CALL_SCHEDULED,
      userId: cmd.userId,
      ownerId: cmd.event.event.ownerId,
      contactId: cmd.event.event.contactId,
      buildingId: cmd.event.event.buildingId,
      note: cmd.event.note
    } as CallScheduled)
  }
}
