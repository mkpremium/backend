import { BuildingProps, ProposalProps } from './building'

export interface BuyOfferRepository {
  addNegotiationProposal (building: BuildingProps, proposal: Omit<ProposalProps, 'id'>): Promise<{ id: string }>

  updateNegotiationProposal (proposal: ProposalProps, operatorId: string, patch: Partial<ProposalProps>): Promise<{ id: string }>

  getProposal (proposalId: string): Promise<ProposalProps>
}
