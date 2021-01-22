/**
 * @field {LegacyBuildingRepository} legacyBuildingRepository
 */
export class AddProposalService { // TODO move to container
  constructor (legacyBuildingRepository) {
    this.legacyBuildingRepository = legacyBuildingRepository
  }

  async addProposal (buildingId, propertyAgentId, proposal) {
    const building = await this.legacyBuildingRepository.findByIdOrThrow(buildingId)

    return this.legacyBuildingRepository.addNegotiationProposal(building, propertyAgentId, proposal)
  }
}
