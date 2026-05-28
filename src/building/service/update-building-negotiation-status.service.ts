import { EventPublisher } from '../../infrastructure/event-bus'
import { BuildingsRepository } from '../repository/buildings.repository'
import { BuildingNegotiationStatus, changeNegotiationStatus, withFeaturedOwner } from '../building'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import type { EntityManager } from 'typeorm'
import { Building } from '../building.entity'
import { mapBuildingStructToEntity } from '../repository/postgres-buildings.repository'
import { AppDataSource } from '../../data-source'
import { CallQueue } from '../../call/call-queue.entity'
export interface BuildingNegotiationStatusChanged {
  name: DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED;
  buildingId: string;
  userId: string;
  negotiationStatus: BuildingNegotiationStatus;
}

interface UpdateBuildingNegotiationStatusCommand {
  status: BuildingNegotiationStatus;
  userId: string;
  sourceOwnerId?: string;
  flipperId?: string;
  em?: EntityManager;
}

export class UpdateBuildingNegotiationStatusService {
  constructor (
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventPublisher
  ) {
  }

  async updateBuildingStatus (buildingId: string, {
    status,
    userId,
    sourceOwnerId,
    flipperId,
    em
  }: UpdateBuildingNegotiationStatusCommand) {
    let updatedBuilding = changeNegotiationStatus(
      await this.buildingsRepository.get(buildingId),
      status,
      flipperId
    )
    if (sourceOwnerId) {
      updatedBuilding = withFeaturedOwner(updatedBuilding, sourceOwnerId)
    }
    if (status === 'NO VENDE') {
      await this.syncCallQueueStatus(buildingId)
    }
    if (em) {
      await em.save(Building, mapBuildingStructToEntity(updatedBuilding))
    } else {
      await this.buildingsRepository.save(updatedBuilding)
    }

    await this.eventBus.publish({
      name: DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
      buildingId,
      userId,
      negotiationStatus: status
    } as BuildingNegotiationStatusChanged, em)
  }

  async syncCallQueueStatus (buildingId: string) {
    try {
      const callQueueRepo = AppDataSource.getRepository(CallQueue)
      const callQueue = await callQueueRepo.findOne({
        where: { buildingId }
      })
      if (!callQueue) return
      callQueue.status = 'NO_SALE'
      callQueue.freezeUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 meses
      callQueue.callCount = 0
      callQueue.canCall = false
      await callQueueRepo.save(callQueue)
    } catch (err) {
      console.log('Error actualizando call_queue')
    }
  }
}
