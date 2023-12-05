import { ProposalProps } from '../building'

export interface ProposalsRepository {
  pendingProposals (): Promise<ProposalProps[]>

  save (props: Omit<ProposalProps, 'id'>): Promise<ProposalProps>
}
