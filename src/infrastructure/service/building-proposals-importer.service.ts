import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { BuildingMetadataProps, ProposalProps } from '../../building/building'
import { BuildingImage } from '../../building/building-image.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { EventPublisher } from '../event-bus'
import { Logger } from 'winston'
import { Proposal } from '../../building/proposal.entity'
import { oldProposalToEntityStatus } from '../../building/repository/postgres-proposals.repository'

export class BuildingProposalsImporterService {
  constructor (
    private readonly entityManager: EntityManager,
    private readonly eventBus: EventPublisher,
    private readonly logger: Logger,
  ) {
  }

  async importBuildingProposal (buildingId: string) {
    this.logger.info('Building imported, importing its proposals', { buildingId })
    const proposals = await this.entityManager
      .createQueryBuilder(CouchbaseDocument, 'proposal')
      .where('proposal.document ->> \'buildingId\' = :buildingId', { buildingId })
      .andWhere('proposal.documentType = :documentType', { documentType: CouchbaseDocumentType.BUILDING_PROPOSAL })
      .getMany()

    this.logger.info('Found proposals for building', { buildingId, count: proposals.length })

    await this.entityManager.transaction(async em => {
      for (const proposal of proposals) {
        const original = proposal.document as ProposalProps
        await em.save(Proposal, {
          id: proposal.id,
          status: oldProposalToEntityStatus(original.state),
          building: { id: buildingId },
          owner: { id: original.ownerId },
          author: { id: original.createdBy },
          amount: original.proposal,
          message: original.message,
          notificationEmail: original.notificationEmail,
          notificationSentAt: original.notificationSentAt,
          notificationStatus: original.notificationStatus,
          createdAt: original.createdAt,
          updatedAt: original.updatedAt,
        })
      }

      await this.eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMAGES_IMPORTED,
        buildingId,
        proposals: proposals.map(i => i.id),
      }, em)
    })

    this.logger.info('All building proposals imported', { buildingId })
  }
}
