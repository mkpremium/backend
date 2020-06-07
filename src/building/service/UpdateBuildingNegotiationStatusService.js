const validNegotiationStatuses = [
  'PENDIENTE',
  'PROPUESTA ENVIADA',
  'COMPRADO',
  'VENDIDO',
  'NO VENDE',

  'DESCARTADO'
]

export class UpdateBuildingNegotiationStatusService {
  constructor (buildingRepository, eventBus) {
    this.buildingRepository = buildingRepository
    this.eventBus = eventBus
  }

  async updateBuildingStatus (buildingId, negotiationStatus) {
    if (validNegotiationStatuses.indexOf(negotiationStatus) === -1) {
      throw new InvalidBuildingNegotiationStatus(buildingId, negotiationStatus)
    }

    await this.buildingRepository.setBuildingNegotiationStatus(buildingId, negotiationStatus)
    await this.eventBus.publish(new BuildingNegotiationStatusChanged(buildingId, negotiationStatus))
  }
}

export class BuildingNegotiationStatusChanged {
  constructor (buildingId, newNegotiationStatus) {
    this.buildingId = buildingId
    this.newNegotiationStatus = newNegotiationStatus
  }
}

export class InvalidBuildingNegotiationStatus extends Error {
  constructor (buildingId, negotiationStatus) {
    super(`Invalid negotiation status ${negotiationStatus} for building ${buildingId}`)
    this.buildingId = buildingId
    this.negotiationStatus = negotiationStatus
  }
}
