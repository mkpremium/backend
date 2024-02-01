import { CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { ProposalProps } from '../../building/building'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { EventPublisher } from '../event-bus'
import { Logger } from 'winston'
import { Proposal } from '../../building/proposal.entity'
import { oldProposalToEntityStatus } from '../../building/repository/postgres-proposals.repository'
import { markCouchbaseDocumentAsMigrated } from '../postgres/get-couchbase-document'
import { CouchbaseDocumentRepository } from '../postgres/couchbase-document.repository'

export class BuildingProposalsImporterService {
  constructor (
    protected readonly entityManager: EntityManager,
    private readonly eventBus: EventPublisher,
    private readonly logger: Logger,
    private readonly couchbaseDocumentRepository: CouchbaseDocumentRepository
  ) {
  }

  async importBuildingProposal (buildingId: string) {
    this.logger.info('Building imported, importing its proposals', { buildingId })
    const proposals = await this.couchbaseDocumentRepository.getBuildingNonMigratedRelatedDocuments(
      CouchbaseDocumentType.BUILDING_PROPOSAL, buildingId)
    this.logger.info('Found proposals for building', { buildingId, count: proposals.length })

    await this.entityManager.transaction(async em => {
      for (const proposal of proposals) {
        const original = proposal.document as ProposalProps

        // Some fields might be empty on old proposals, so we need to fill them
        // to avoid database constraint errors.
        original.createdAt ??= new Date()
        original.updatedAt ??= original.createdAt
        original.notificationEmail ??= 'jorge.velasco.silva@gmail.com'
        original.notificationStatus ??= 'DISABLED'
        original.message ??= ''

        await em.save(Proposal, {
          id: (proposal.document as {id: string}).id,
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
          aspiration: original.aspiration
        })
        await markCouchbaseDocumentAsMigrated(em, proposal.id)
      }

      await this.eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMAGES_IMPORTED,
        buildingId,
        proposals: proposals.map(i => i.id)
      }, em)
    })

    this.logger.info('All building proposals imported', { buildingId })
  }
}
