import { BuyOfferRepository } from '../buy-offer.repository'
import { BuildingsRepository } from '../repository/buildings.repository'

export class AddProposalService {
  constructor (
    private offerRepository: BuyOfferRepository,
    private buildingsRepository: BuildingsRepository
    ) {
  }

  async addProposal (buildingId, propertyAgentId, proposal) {
    const building = await this.buildingsRepository.get(buildingId)

    return this.offerRepository.addNegotiationProposal(building, propertyAgentId, proposal)
  }
}
