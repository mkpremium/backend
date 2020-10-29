import { buildingNegotiationStatus } from '../building'

/**
 * @property {BuildingsRepository} buildingRepository
 * @property {EventBus} eventBus
 */
export class UpdateBuildingNegotiationStatusService {
  constructor (buildingRepository, eventBus) {
    this.buildingRepository = buildingRepository
    this.eventBus = eventBus
  }

  async updateBuildingStatus (buildingId, negotiationStatus, operatorId) {
    if (buildingNegotiationStatus.indexOf(negotiationStatus) === -1) {
      throw new InvalidBuildingNegotiationStatus(buildingId, negotiationStatus)
    }

    await this.buildingRepository.setBuildingNegotiationStatus(buildingId, negotiationStatus)
    await this.eventBus.publish(new BuildingNegotiationStatusChanged(buildingId, operatorId))
  }
}

export class BuildingNegotiationStatusChanged {
  constructor (buildingId, operatorId) {
    this.operatorId = operatorId
    this.name = 'BUILDING_NEGOTIATION_STATUS_CHANGED'
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
