import { BuyOfferRepository } from '../buy-offer.repository'
import { BuildingsRepository } from '../repository/buildings.repository'
import { ProposalProps } from '../building'

export class AddProposalService {
  constructor (
    private buyOffersRepository: BuyOfferRepository,
    private buildingsRepository: BuildingsRepository
  ) {
  }

  async addProposal (buildingId: string, userId: string, partialProposal: Omit<ProposalProps, 'id' | 'createdBy' | 'buildingId'>) {
    const building = await this.buildingsRepository.get(buildingId)

    const proposal = {
      ...partialProposal,
      createdBy: userId,
      buildingId: building.id,
    }


    return this.buyOffersRepository.addNegotiationProposal(building, proposal)
  }
}
