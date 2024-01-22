import t from 'tcomb'
import { Event, ScheduledEventProps } from '../types'

export const UpdateScheduledEvent = t.struct<ScheduledEventProps>({
  eventDate: t.maybe(t.Date),
  event: t.maybe(Event),
  createdBy: t.String,
}, 'UpdateScheduledEvent')

export interface ScheduledEventsRepository {
  update (id: string, data: Pick<ScheduledEventProps, 'eventDate'>): Promise<ScheduledEventProps>
  delete (id): Promise<void>
}
