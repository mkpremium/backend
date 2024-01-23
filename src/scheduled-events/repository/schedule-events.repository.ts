import { ScheduledEventProps } from '../types'

export interface ScheduledEventsRepository {
  delete (id: string): Promise<void>
  lastScheduledEventForBuilding(buildingId: string): Promise<ScheduledEventProps>
  update (id: string, data: Pick<ScheduledEventProps, 'eventDate'>): Promise<ScheduledEventProps>
}
