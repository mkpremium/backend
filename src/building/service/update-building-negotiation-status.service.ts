import { EventPublisher } from '../../infrastructure/event-bus'
import { BuildingsRepository } from '../repository/buildings.repository'
import { BuildingNegotiationStatus, changeNegotiationStatus, withFeaturedOwner } from '../building'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import type { EntityManager } from 'typeorm'
import { Building } from '../building.entity'

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
    em
  }: UpdateBuildingNegotiationStatusCommand) {
    let updatedBuilding = changeNegotiationStatus(
      await this.buildingsRepository.get(buildingId),
      status
    )
    if (sourceOwnerId) {
      updatedBuilding = withFeaturedOwner(updatedBuilding, sourceOwnerId)
    }

    if (em) {
      await em.save(Building, updatedBuilding)
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
}
