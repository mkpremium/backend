/**
 * @property {BuildingsRepository} buildingsRepository
 * @property {EventBus} eventBus
 */
export class UpdateBuildingNegotiationStatusService {
  constructor (buildingsRepository, eventBus) {
    this.buildingsRepository = buildingsRepository
    this.eventBus = eventBus
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
