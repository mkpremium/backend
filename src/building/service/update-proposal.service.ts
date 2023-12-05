import { BuyOfferRepository } from '../buy-offer.repository'
import { ProposalProps } from '../building'

export class UpdateProposalService {
  constructor (
    private offerRepository: BuyOfferRepository,
    ) {
  }

  async updateProposal (proposalId: string, callerId: string, proposalUpdate: Partial<ProposalProps>) {
    const proposal = await this.offerRepository.getProposal(proposalId)

    return this.offerRepository.updateNegotiationProposal(proposal, callerId, proposalUpdate)
  }
}
