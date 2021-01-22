import { buildingNegotiationStatus } from '../building'

/**
 * @property {BuildingsRepository} buildingsRepository
 * @property {EventBus} eventBus
 */
export class UpdateBuildingNegotiationStatusService {
  constructor (buildingsRepository, eventBus) {
    this.buildingsRepository = buildingsRepository
    this.eventBus = eventBus
  }

  async updateBuildingStatus (buildingId, negotiationStatus, operatorId) {
    if (buildingNegotiationStatus.indexOf(negotiationStatus) === -1) {
      throw new InvalidBuildingNegotiationStatus(buildingId, negotiationStatus)
    }

    await this.buildingsRepository.setBuildingNegotiationStatus(buildingId, negotiationStatus)
    await this.eventBus.publish(new BuildingNegotiationStatusChanged(buildingId, operatorId, negotiationStatus))
  }
}

export const BUILDING_NEGOTIATION_STATUS_CHANGED = 'BUILDING_NEGOTIATION_STATUS_CHANGED'
export class BuildingNegotiationStatusChanged {
  constructor (buildingId, operatorId, negotiationStatus) {
    this.name = BUILDING_NEGOTIATION_STATUS_CHANGED
    this.operatorId = operatorId
    this.negotiationStatus = negotiationStatus
    this.buildingId = buildingId
  }
}

export class InvalidBuildingNegotiationStatus extends Error {
  constructor (buildingId, negotiationStatus) {
    super(`Invalid negotiation status ${negotiationStatus} for building ${buildingId}`)
    this.buildingId = buildingId
    this.negotiationStatus = negotiationStatus
  }
}
