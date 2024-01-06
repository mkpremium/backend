import { ScheduledEventsRepository } from './schedule-events.repository'
import { WithPostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { ScheduledEvent } from '../scheduled-event.entity'
import { CallScheduledProps, ScheduledEventId, ScheduledEventProps } from '../types'
import { EntityTarget, Equal } from 'typeorm'

export class PostgresScheduledEventsRepository extends WithPostgresRepository<ScheduledEvent> implements ScheduledEventsRepository {
  addScheduledMeetingEvent (data: Omit<ScheduledEventProps, 'id' | 'type' | '_documentType' | 'createdAt'>, createdBy: string): Promise<CallScheduledProps> {
    throw new Error('Method not implemented.')
  }

  update (id: string, data: Partial<ScheduledEventProps>): Promise<ScheduledEventProps> {
    throw new Error('Method not implemented.')
  }

  save (data: Omit<ScheduledEventProps, 'id'>): Promise<ScheduledEventProps> {
    throw new Error('Method not implemented.')
  }

  delete (id: any): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async lastScheduledEventForBuilding (buildingId: string): Promise<ScheduledEventProps> {
    const lastBuildingScheduledEvent = await this.repository.findOne({
      order: { scheduledFor: 'DESC' },
      relations: {
        contact: true,
        createdBy: true,
        notifyTo: true,
        owner: true,
      },
      where: { building: Equal(buildingId) }
    })
    if (!lastBuildingScheduledEvent)
      return null

    return {
      id: lastBuildingScheduledEvent.id as ScheduledEventId,
      type: 'CALLS',
      createdBy: lastBuildingScheduledEvent.createdBy.id,
      eventDate: lastBuildingScheduledEvent.scheduledFor,
      notifyTo: lastBuildingScheduledEvent.notifyTo.id,
      createdAt: lastBuildingScheduledEvent.createdAt,
      event: {
        buildingId,
        contactId: lastBuildingScheduledEvent.contact.id,
        ownerId: lastBuildingScheduledEvent.owner.id,
        worksheetId: undefined,
        inPerson: undefined,
      }
    }
  }

  protected getEntityTarget (): EntityTarget<ScheduledEvent> {
    return ScheduledEvent
  }
}
