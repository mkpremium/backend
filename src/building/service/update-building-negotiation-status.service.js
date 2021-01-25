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
    await this.eventBus.publish(new BuildingNegotiationStatusChanged(buildingId, userId, status))
  }
}

export const BUILDING_NEGOTIATION_STATUS_CHANGED = 'building.negotiation-status-changed'

export class BuildingNegotiationStatusChanged {
  constructor (buildingId, operatorId, negotiationStatus) {
    this.name = BUILDING_NEGOTIATION_STATUS_CHANGED
    this.operatorId = operatorId
    this.negotiationStatus = negotiationStatus
    this.buildingId = buildingId
  }
}
