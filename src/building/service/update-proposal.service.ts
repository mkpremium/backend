import { BuyOfferRepository } from '../buy-offer.repository'
import { ProposalProps } from '../building'

export class UpdateProposalService {
  constructor (
    private buyOffersRepository: BuyOfferRepository,
    ) {
  }

  async updateProposal (proposalId: string, callerId: string, proposalUpdate: Partial<ProposalProps>) {
    const proposal = await this.buyOffersRepository.getProposal(proposalId)

    return this.buyOffersRepository.updateNegotiationProposal(proposal, callerId, proposalUpdate)
  }
}
