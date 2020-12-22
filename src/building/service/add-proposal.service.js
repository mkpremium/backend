export class AddProposalService {
  constructor (buildingRepository) {
    this.buildingRepository = buildingRepository
  }

  async addProposal (buildingId, propertyAgentId, proposal) {
    const building = await this.buildingRepository.findByIdOrThrow(buildingId)

    return this.buildingRepository.addNegotiationProposal(building, propertyAgentId, proposal)
  }
}
