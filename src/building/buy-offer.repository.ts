import { ProposalProps } from './building'

export interface BuyOfferRepository {
  getProposal (proposalId: string): Promise<ProposalProps>
}
