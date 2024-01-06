import t from 'tcomb'
import { CallScheduledProps, Event, ScheduledEventProps } from '../types'

export const UpdateScheduledEvent = t.struct<ScheduledEventProps>({
  eventDate: t.maybe(t.Date),
  event: t.maybe(Event),
  createdBy: t.String,
}, 'UpdateScheduledEvent')

export interface ScheduledEventsRepository {
  addScheduledMeetingEvent (data: Omit<ScheduledEventProps, 'id' | 'type' | 'createdAt' | '_documentType'>, createdBy: string): Promise<CallScheduledProps>

  addScheduleCallEvent (data: Omit<CallScheduledProps, 'id' | 'type'>, createdBy: string): Promise<CallScheduledProps>

  update (id: string, data: Partial<ScheduledEventProps>): Promise<ScheduledEventProps>
  save (data: Omit<ScheduledEventProps, 'id'>): Promise<ScheduledEventProps>
  delete (id): Promise<void>

  lastScheduledEventForBuilding (buildingId): Promise<ScheduledEventProps | undefined>
}
