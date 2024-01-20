import { EventPublisher } from '../../infrastructure/event-bus'
import type { CallScheduledProps, ScheduledEventProps } from '../types'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { WorksheetQueueRepository } from '../../worksheet/repository/worksheet-queue.repository'
import { CallSchedulerService } from '../../worksheet/service/call-scheduler.service'
import { CouchbaseScheduledEventsRepository } from '../repository/couchbase-schedule-events.repository'
import { DataSource } from 'typeorm'
import { ScheduledEvent } from '../scheduled-event.entity'
import { toScheduledCall } from '../repository/postgres-schedule-events.repository'
import { CouchbaseWorksheetRepository } from "../../worksheet/repository/couchbase-worksheet.repository";

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
    private couchbaseScheduledEventsRepository: CouchbaseScheduledEventsRepository,
    private callSchedulerService: CallSchedulerService,
    private worksheetQueueRepository: WorksheetQueueRepository,
    private couchbaseWorksheetRepository: CouchbaseWorksheetRepository,
    private eventBus: EventPublisher,
    private usePostgres: boolean,
    private ormDataSource: DataSource,
  ) {
  }

  async scheduleCall (cmd: ScheduleCallCommand): Promise<ScheduledEventProps> {
    return this.usePostgres ? this.doPostgres(cmd) : this.doCouchbase(cmd)
  }

  private async doPostgres (cmd: ScheduleCallCommand): Promise<ScheduledEventProps> {
    const savedEntity = await this.ormDataSource.manager.save(ScheduledEvent, {
      type: 'CALLS',
      scheduledFor: cmd.event.eventDate,
      notifyTo: { id: cmd.event.notifyTo },
      createdBy: { id: cmd.userId },
      building: { id: cmd.event.event.buildingId },
      contact: { id: cmd.event.event.contactId },
      owner: { id: cmd.event.event.ownerId },
    }) as ScheduledEvent

    await this.publishCallScheduledEvent(cmd)

    return toScheduledCall(savedEntity)
  }

  private async doCouchbase (cmd: ScheduleCallCommand) {
    const worksheet = await this.couchbaseWorksheetRepository.ofBuildingId(cmd.event.event.buildingId)
    cmd.event.event.worksheetId = worksheet.id
    const scheduledEvent = await this.couchbaseScheduledEventsRepository.addScheduleCallEvent(cmd.event, cmd.userId)

    const queue = await this.worksheetQueueRepository.get(cmd.queueId)
    await this.callSchedulerService.scheduleWorksheetInQueue(queue, scheduledEvent)

    await this.publishCallScheduledEvent(cmd)

    return scheduledEvent
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
