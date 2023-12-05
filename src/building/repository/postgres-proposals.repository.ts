import { WithPostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Proposal } from '../proposal.entity'
import { EntityTarget } from 'typeorm'
import { ProposalsRepository } from './proposals.repository'
import { ProposalProps } from '../building'

export class PostgresProposalsRepository extends WithPostgresRepository<Proposal> implements ProposalsRepository {
  pendingProposals (): Promise<ProposalProps[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  save (props: Omit<ProposalProps, 'id'>): Promise<ProposalProps> {
    return Promise.reject(new Error('Not implemented'))
  }

  protected getEntityTarget (): EntityTarget<Proposal> {
    return Proposal
  }
}
