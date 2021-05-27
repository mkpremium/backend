import { EventBus } from '../../infrastructure/event-bus'
import { BuildingsRepository } from '../repository/buildings.repository'

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
    })
  }
}

export const BUILDING_NEGOTIATION_STATUS_CHANGED = 'building.negotiation-status-changed'
