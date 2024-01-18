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

  async delete (id: string): Promise<void> {
    await this.repository.delete(id)
  }

  // Different to one in the Couchbase repository which seem to be intended for the
  // proposal sender only.
  async lastScheduledEventForBuilding (buildingId: string): Promise<ScheduledEventProps> {
    const lastBuildingScheduledEvent = await this.repository.findOne({
      order: { scheduledFor: 'DESC' },
      relations: {
        building: true,
        contact: true,
        createdBy: true,
        notifyTo: true,
        owner: true,
      },
      where: { building: Equal(buildingId) }
    })
    if (!lastBuildingScheduledEvent)
      return null

    return toScheduledCall(lastBuildingScheduledEvent)
  }

  protected getEntityTarget (): EntityTarget<ScheduledEvent> {
    return ScheduledEvent
  }
}

export function toScheduledCall (se: ScheduledEvent): ScheduledEventProps {
  return {
    id: se.id as ScheduledEventId,
    type: 'CALLS',
    createdBy: se.createdBy.id,
    eventDate: se.scheduledFor,
    notifyTo: se.notifyTo.id,
    createdAt: se.createdAt,
    event: {
      buildingId: se.building.id,
      contactId: se.contact.id,
      ownerId: se.owner.id,
      worksheetId: undefined,
      inPerson: false,
    }
  }
}
