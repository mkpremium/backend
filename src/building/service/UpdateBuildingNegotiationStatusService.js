import { History } from '../../history/models'

export class UpdateBuildingNegotiationStatusService {
  constructor (buildingRepository) {
    this.buildingRepository = buildingRepository
  }

  async updateBuildingStatus (buildingId, negotiationStatus, agentId) {
    await this.buildingRepository.setBuildingNegotiationStatus(buildingId, negotiationStatus)
    await History.registerUpdate({ user: {id: agentId}, contextModel: 'Building.negotiationStatus' })
  }
}
