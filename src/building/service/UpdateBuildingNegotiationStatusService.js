const validNegotiationStatuses = [
  'PENDIENTE',
  'PROPUESTA ENVIADA',
  'COMPRADO',
  'VENDIDO',
  'NO VENDE',

  'DESCARTADO'
]

export class UpdateBuildingNegotiationStatusService {
  constructor (buildingRepository) {
    this.buildingRepository = buildingRepository
  }

  async updateBuildingStatus (buildingId, negotiationStatus) {
    if (validNegotiationStatuses.indexOf(negotiationStatus) === -1) {
      throw new InvalidBuildingNegotiationStatus(buildingId, negotiationStatus)
    }

    await this.buildingRepository.setBuildingNegotiationStatus(buildingId, negotiationStatus)
  }
}

export class InvalidBuildingNegotiationStatus extends Error {
  constructor (buildingId, negotiationStatus) {
    super(`Invalid negotiation status ${negotiationStatus} for building ${buildingId}`)
    this.buildingId = buildingId
    this.negotiationStatus = negotiationStatus
  }
}
