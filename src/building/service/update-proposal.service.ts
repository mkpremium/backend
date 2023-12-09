import { BuyOfferRepository } from '../buy-offer.repository'
import { ProposalProps } from '../building'
import { CouchbaseBuildingsRepository } from '../repository/couchbase-building.repository'
import { CouchbaseProposalsRepository } from '../repository/couchbase-proposals.repository'
import { PostgresProposalsRepository } from '../repository/postgres-proposals.repository'
import t from 'tcomb'

type UpdateProposalCommand = { patch: Partial<ProposalProps>; callerId: string; proposalId: string }

export class UpdateProposalService {
  constructor (
    private couchbaseBuildingsRepository: CouchbaseBuildingsRepository,
    private couchbaseProposalsRepository: CouchbaseProposalsRepository,
    private postgresProposalsRepository: PostgresProposalsRepository,
    private usePostgres: boolean
  ) {
  }

  async updateProposal (proposalId: string, callerId: string, proposalUpdate: Partial<ProposalProps>) {
    const cmd: UpdateProposalCommand = {
      proposalId,
      callerId,
      patch: proposalUpdate,
    }

    return this.usePostgres ? this.updateProposalInPostgres(cmd) : this.updateProposalInCouchbase(cmd)
  }

  private updateProposalInPostgres (cmd: UpdateProposalCommand) {
    return this.postgresProposalsRepository.save({
      ...cmd.patch,
      id: cmd.proposalId,
    } as ProposalProps)
  }

  private async updateProposalInCouchbase (cmd: UpdateProposalCommand) {
    const proposal = await this.couchbaseProposalsRepository.get(cmd.proposalId)
    const updatedProposal = t.update(proposal, {
      $merge: Object.assign({}, cmd.patch, {
        updatedBy: cmd.callerId,
        updatedAt: new Date()
      })
    })

    await this.couchbaseProposalsRepository.save(updatedProposal)

    const building = await this.couchbaseBuildingsRepository.get(proposal.buildingId)
    const updatedBuilding = t.update(building, { recentProposal: { $set: proposal } })
    await this.couchbaseBuildingsRepository.save(updatedBuilding)

    return proposal
  }
}
