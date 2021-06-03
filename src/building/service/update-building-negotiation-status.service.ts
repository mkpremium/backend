import { EventBus } from '../../infrastructure/event-bus'
import { BuildingsRepository } from '../repository/buildings.repository'
import { BuildingNegotiationStatus } from '../building'

interface BuildingNegotiationStatusChanged {
  name: 'building.negotiation-status-changed';
  buildingId: string;
  userId: string;
  negotiationStatus: BuildingNegotiationStatus;
}

export class UpdateBuildingNegotiationStatusService {
  constructor (
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventBus
  ) {
  }

  async updateBuildingStatus (buildingId, { status, userId, sourceOwnerId }) {
    const building = await this.buildingsRepository.get(buildingId)
    let updatedBuilding = building.changeNegotiationStatus(status)
    if (sourceOwnerId) {
      updatedBuilding = updatedBuilding.withFeaturedOwner(sourceOwnerId)
    }

    await this.buildingsRepository.save(updatedBuilding)
    await this.eventBus.publish({
      name: BUILDING_NEGOTIATION_STATUS_CHANGED,
      buildingId,
      userId,
      negotiationStatus: status
    } as BuildingNegotiationStatusChanged)
  }
}

export const BUILDING_NEGOTIATION_STATUS_CHANGED = 'building.negotiation-status-changed'
