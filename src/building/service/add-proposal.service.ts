import { ProposalProps } from '../building'
import { PostgresProposalsRepository } from '../repository/postgres-proposals.repository'

export class AddProposalService {
  constructor (
    private proposalsRepository: PostgresProposalsRepository
  ) {
  }

  async addProposal (buildingId: string, userId: string, partialProposal: Omit<ProposalProps, 'id' | 'createdBy' | 'buildingId'>) {
    return this.proposalsRepository.save({
      ...(partialProposal),
      buildingId,
      createdBy: userId
    })
  }
}
