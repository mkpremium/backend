import { LegacyBuildingRepository } from '../models'

export class AddProposalService {
  private legacyBuildingsRepository: LegacyBuildingRepository

  constructor ({ legacyBuildingsRepository }: { legacyBuildingsRepository: LegacyBuildingRepository }) {
    this.legacyBuildingsRepository = legacyBuildingsRepository
  }

  async addProposal (buildingId, propertyAgentId, proposal) {
    const building = await this.legacyBuildingsRepository.findByIdOrThrow(buildingId)

    return this.legacyBuildingsRepository.addNegotiationProposal(building, propertyAgentId, proposal)
  }
}
