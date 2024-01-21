import { ScheduledEventsRepository } from './schedule-events.repository'
import { WithPostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { ScheduledEvent } from '../scheduled-event.entity'
import { ScheduledEventId, ScheduledEventProps } from '../types'
import { EntityTarget, Equal } from 'typeorm'

export interface LastBuildingMeeting {
  meeting_scheduledFor: Date,
  buildingId: string,
  ownerId: string
}

export class PostgresScheduledEventsRepository extends WithPostgresRepository<ScheduledEvent> implements ScheduledEventsRepository {
  lastMeetingForBuildings(buildingIds: string[]): Promise<LastBuildingMeeting[]> {
    return this.repository.createQueryBuilder('meeting')
      .distinctOn(['meeting.buildingId'])
      .select(['meeting.scheduledFor', 'meeting.ownerId', 'meeting.buildingId'])
      .where('meeting.buildingId IN (:...buildingIds)', {buildingIds})
      .andWhere('meeting.type = :eventType', {eventType: 'MEETING'})
      .orderBy('meeting.buildingId')
      .addOrderBy('meeting.buildingId', 'DESC')
      .getRawMany<LastBuildingMeeting>()
  }

  update (id: string, data: Partial<ScheduledEventProps>): Promise<ScheduledEventProps> {
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
