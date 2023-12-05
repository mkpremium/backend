import { BuildingProps, ProposalProps } from './building'

export interface BuyOfferRepository {
  addNegotiationProposal (building: BuildingProps, operatorId: string, proposal: ProposalProps): Promise<{ id: string }>

  updateNegotiationProposal (proposal: ProposalProps, operatorId: string, patch: Partial<ProposalProps>): Promise<{ id: string }>

  getProposal (proposalId: string): Promise<ProposalProps>
}
