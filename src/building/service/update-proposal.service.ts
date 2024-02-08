import { ProposalProps } from '../building'
import { PostgresProposalsRepository } from '../repository/postgres-proposals.repository'

type UpdateProposalCommand = { patch: Partial<ProposalProps>; callerId: string; proposalId: string }

export class UpdateProposalService {
  constructor (
    private postgresProposalsRepository: PostgresProposalsRepository
  ) {
  }

  async updateProposal (proposalId: string, callerId: string, proposalUpdate: Partial<ProposalProps>) {
    const cmd: UpdateProposalCommand = {
      proposalId,
      callerId,
      patch: proposalUpdate
    }

    return this.postgresProposalsRepository.save({
      ...cmd.patch,
      id: cmd.proposalId
    } as ProposalProps)
  }
}
