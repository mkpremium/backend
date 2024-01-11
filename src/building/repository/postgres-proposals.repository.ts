import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Proposal } from '../proposal.entity'
import { DeepPartial, EntityTarget } from 'typeorm'
import { ProposalsRepository } from './proposals.repository'
import { ProposalProps } from '../building'

export class PostgresProposalsRepository extends PostgresRepository<ProposalProps, Proposal> implements ProposalsRepository {
  async pendingProposals (): Promise<ProposalProps[]> {
    const pendingProposals = await this.repository.find({
      where: {
        notificationStatus: 'PENDING',
      },
      relations: {
        building: true,
        owner: true,
        author: true,
      }
    })

    return pendingProposals.map(this.entityToStruct)
  }

  protected structToEntity (struct: ProposalProps): DeepPartial<Proposal> {
    return {
      id: struct.id,
      status: oldProposalToEntityStatus(struct.state),
      building: { id: struct.buildingId },
      owner: { id: struct.ownerId },
      author: { id: struct.createdBy },
      amount: struct.proposal,
      notificationEmail: struct.notificationEmail,
      notificationStatus: struct.notificationStatus,
      message: struct.message,
    }
  }

  protected entityToStruct (entity: Proposal): ProposalProps {
    return {
      id: entity.id,
      state: entityStatusToOldProposal(entity.status),
      buildingId: entity.building.id,
      ownerId: entity.owner.id,
      createdBy: entity.author.id,
      proposal: entity.amount,
      notificationEmail: entity.notificationEmail,
      notificationStatus: entity.notificationStatus,
      message: entity.message,
    }
  }

  protected getEntityTarget (): EntityTarget<Proposal> {
    return Proposal
  }
}

const oldStates = [ 'aceptada', 'enviada', 'pendiente'] as const
const newStatus = [ 'PENDING', 'SENT', 'ACCEPTED' ] as const

export function oldProposalToEntityStatus (state: 'aceptada' | 'enviada' | 'pendiente') {
  return newStatus[ oldStates.indexOf(state) ]
}

export function entityStatusToOldProposal (status: 'ACCEPTED' | 'SENT' | 'PENDING') {
  return oldStates[ newStatus.indexOf(status) ]
}
