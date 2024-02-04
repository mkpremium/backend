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
import { Owner } from '../../owner/owner.entity'
import { type AddOwnerCommand, AddOwnerService } from '../../owner/service/add-owner.service'

export class BuildingProposalsImporterService {
  constructor (
    protected readonly entityManager: EntityManager,
    private readonly eventBus: EventPublisher,
    private readonly logger: Logger,
    private readonly couchbaseDocumentRepository: CouchbaseDocumentRepository,
    private readonly addOwnerService: AddOwnerService
  ) {
  }

  async importBuildingProposal (buildingId: string) {
    this.logger.info('Building imported, importing its proposals', { buildingId })
    const proposals = await this.couchbaseDocumentRepository.getBuildingNonMigratedRelatedDocuments(
      CouchbaseDocumentType.BUILDING_PROPOSAL, buildingId)
    this.logger.info('Found proposals for building', { buildingId, count: proposals.length })

    for (const proposal of proposals) {
      const original = proposal.document as ProposalProps

      // Some fields might be empty on old proposals, so we need to fill them
      // to avoid database constraint errors.
      original.createdAt ??= new Date()
      original.updatedAt ??= original.createdAt
      original.notificationEmail ??= 'jorge.velasco.silva@gmail.com'
      original.notificationStatus ??= 'DISABLED'
      original.message ??= ''

      try {
        await this.entityManager.transaction(async em => {
          const owner = await this.getOwner(em, original)
          await em.save(Proposal, {
            id: (proposal.document as { id: string }).id,
            status: oldProposalToEntityStatus(original.state),
            building: { id: buildingId },
            owner,
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

          await this.eventBus.publish({
            name: DomainEventCatalog.BUILDING__PROPOSAL_IMPORTED,
            buildingId,
            proposals: proposals.map(i => i.id)
          }, em)
        })
      } catch (error) {
        this.logger.error('Error importing building proposal', {
          buildingId,
          proposalId: proposal.id,
          error: error.message
        })
      }
    }

    this.logger.info('All building proposals imported', { buildingId })
  }

  private async getOwner (entityManager: EntityManager, original: ProposalProps): Promise<{ id: string }> {
    const existingOwner = await entityManager.findOneBy(Owner, { id: original.ownerId })
    if (existingOwner) {
      return existingOwner
    }
    this.logger.warning('Owner not found, creating a new one', { ownerId: original.ownerId, proposalId: original.id })
    const addOwnerCommand: AddOwnerCommand = {
      buildingId: original.buildingId,
      id: original.ownerId,
      note: 'Creado por importador de propuestas',
      status: 'VERIFICADO',
      type: 'PRINCIPAL',
      person: {
        name: 'Propietario',
        firstName: 'Propietario',
        firstSurname: 'Propietario',
        secondSurname: 'Propietario',
        contacts: []
      }
    }
    if (original.notificationEmail) {
      addOwnerCommand.person.contacts.push({
        type: 'EMAIL',
        status: 'GOOD',
        value: original.notificationEmail
      })
    }

    return await this.addOwnerService.addOwner(addOwnerCommand, 'building-proposals-importer')
  }
}
