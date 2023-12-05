import { BuildingProps, ProposalProps } from './building'

export interface BuyOfferRepository {
  addNegotiationProposal (building: BuildingProps, operatorId: string, proposal: ProposalProps): Promise<{ id: string }>

  updateNegotiationProposal (proposal: ProposalProps, operatorId: string, patch: ProposalProps): Promise<{ id: string }>
}
