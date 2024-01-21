import t from 'tcomb'
import { Event, ScheduledEventProps } from '../types'

export const UpdateScheduledEvent = t.struct<ScheduledEventProps>({
  eventDate: t.maybe(t.Date),
  event: t.maybe(Event),
  createdBy: t.String,
}, 'UpdateScheduledEvent')

export interface ScheduledEventsRepository {
  update (id: string, data: Partial<ScheduledEventProps>): Promise<ScheduledEventProps>
  save (data: Omit<ScheduledEventProps, 'id'>): Promise<ScheduledEventProps>
  delete (id): Promise<void>
}
