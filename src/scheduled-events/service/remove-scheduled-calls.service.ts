import { ScheduledCallsRepository } from '../repository/scheduled-calls.repository'
import { type EntityManager } from 'typeorm'
import { ScheduledEvent } from '../scheduled-event.entity'

export class RemoveScheduledCallsService {
  constructor (
    private scheduledCallsRepository: ScheduledCallsRepository,
    private usePostgres: boolean,
    private entityManager: EntityManager
  ) {
  }

  async removeScheduledCallsFor (buildingId: string) {
    if (this.usePostgres) {
      await this.entityManager.delete(ScheduledEvent, {
        building: { id: buildingId },
        type: 'CALLS'
      })
    } else {
      await this.scheduledCallsRepository.removeScheduledCallsForBuilding(buildingId)
    }
  }
}
