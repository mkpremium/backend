import { ProposalProps } from './building'

export interface BuyOfferRepository {
  updateNegotiationProposal (proposal: ProposalProps, operatorId: string, patch: Partial<ProposalProps>): Promise<{ id: string }>

  getProposal (proposalId: string): Promise<ProposalProps>
}
