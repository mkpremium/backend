import { ProposalProps } from '../building'
import { CouchbaseProposalsRepository } from '../repository/couchbase-proposals.repository'
import t from 'tcomb'
import { CouchbaseBuildingsRepository } from '../repository/couchbase-building.repository'
import { PostgresProposalsRepository } from '../repository/postgres-proposals.repository'

export class AddProposalService {
  constructor (
    private couchbaseBuildingsRepository: CouchbaseBuildingsRepository,
    private couchbaseProposalsRepository: CouchbaseProposalsRepository,
    private postgresProposalsRepository: PostgresProposalsRepository,
    private usePostgres: boolean
  ) {
  }

  async addProposal (buildingId: string, userId: string, partialProposal: Omit<ProposalProps, 'id' | 'createdBy' | 'buildingId'>) {
    return this.usePostgres
      ? this.addProposalToPostgres(buildingId, userId, partialProposal)
      : this.addProposalToCouchbase(buildingId, userId, partialProposal)
  }

  private async addProposalToPostgres (buildingId: string, userId: string, partialProposal: Omit<ProposalProps, 'id' | 'createdBy' | 'buildingId'>) {
    return this.postgresProposalsRepository.save({
      ...partialProposal,
      buildingId,
      createdBy: userId
    })
  }

  private async addProposalToCouchbase (buildingId: string, userId: string, props: Omit<ProposalProps, 'id' | 'createdBy' | 'buildingId'>) {
    const building = await this.couchbaseBuildingsRepository.get(buildingId) as any
    const proposal = await this.couchbaseProposalsRepository.save({ buildingId, createdBy: userId, ...props })
    const updatedProposals = t.update(building.proposals || [], { $push: [proposal.id] })
    const updatedBuilding = t.update(building, {
      proposals: { $set: updatedProposals },
      recentProposal: { $set: proposal }
    })

    await this.couchbaseBuildingsRepository.save(updatedBuilding)

    return proposal
  }
}
