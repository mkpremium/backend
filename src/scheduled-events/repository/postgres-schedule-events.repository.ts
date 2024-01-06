import { ScheduledEventsRepository } from './schedule-events.repository'
import { WithPostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { ScheduledEvent } from '../scheduled-event.entity'
import { ScheduledEventProps, CallScheduledProps } from '../types'
import { EntityTarget } from 'typeorm'
import Promise from 'bluebird'

export class PostgresScheduledEventsRepository extends WithPostgresRepository<ScheduledEvent> implements ScheduledEventsRepository {
  addScheduledMeetingEvent (data: Omit<ScheduledEventProps, 'id' | 'type' | '_documentType' | 'createdAt'>, createdBy: string): Promise<CallScheduledProps> {
    throw new Error('Method not implemented.')
  }

  addScheduleCallEvent (data: Omit<CallScheduledProps, 'id' | 'type'>, createdBy: string): Promise<CallScheduledProps> {
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

  lastScheduledEventForBuilding (buildingId: any): Promise<ScheduledEventProps> {
    throw new Error('Method not implemented.')
  }

  protected getEntityTarget (): EntityTarget<ScheduledEvent> {
    return ScheduledEvent
  }
}
