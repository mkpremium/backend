import { ScheduledEventProps } from '../types'

export interface ScheduledEventsRepository {
  update (id: string, data: Pick<ScheduledEventProps, 'eventDate'>): Promise<ScheduledEventProps>
  delete (id): Promise<void>
}
