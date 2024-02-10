import { type EntityManager } from 'typeorm'
import { ScheduledEvent } from '../scheduled-event.entity'

export class RemoveScheduledCallsService {
  constructor (
    private entityManager: EntityManager
  ) {
  }

  async removeScheduledCallsFor (buildingId: string) {
    await this.entityManager.delete(ScheduledEvent, {
      building: { id: buildingId },
      type: 'CALLS'
    })
  }
}
