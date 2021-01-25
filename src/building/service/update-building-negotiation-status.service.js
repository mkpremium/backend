/**
 * @property {BuildingsRepository} buildingsRepository
 * @property {EventBus} eventBus
 */
export class UpdateBuildingNegotiationStatusService {
  constructor (buildingsRepository, eventBus) {
    this.buildingsRepository = buildingsRepository
    this.eventBus = eventBus
  }

  async updateBuildingStatus (buildingId, { status, userId }) {
    const building = await this.buildingsRepository.get(buildingId)
    const updatedBuilding = building.changeNegotiationStatus(status)

    await this.buildingsRepository.save(updatedBuilding)
    await this.eventBus.publish({
      name: BUILDING_NEGOTIATION_STATUS_CHANGED,
      buildingId,
      userId,
      status
    })
  }
}

export const BUILDING_NEGOTIATION_STATUS_CHANGED = 'building.negotiation-status-changed'
