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

  async updateBuildingStatus (buildingId, { status, userId }) {
    if (buildingNegotiationStatus.indexOf(status) === -1) {
      throw new InvalidBuildingNegotiationStatus(buildingId, status)
    }

    await this.buildingsRepository.setBuildingNegotiationStatus(buildingId, status)
    await this.eventBus.publish(new BuildingNegotiationStatusChanged(buildingId, userId, status))
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
