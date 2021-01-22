/**
 * @field {LegacyBuildingRepository} legacyBuildingsRepository
 */
export class AddProposalService {
  constructor ({ legacyBuildingsRepository }) {
    this.legacyBuildingsRepository = legacyBuildingsRepository
  }

  async addProposal (buildingId, propertyAgentId, proposal) {
    const building = await this.legacyBuildingsRepository.findByIdOrThrow(buildingId)

    return this.legacyBuildingsRepository.addNegotiationProposal(building, propertyAgentId, proposal)
  }
}
