import type { EventBus } from '../event-bus'
import { DomainEventCatalog } from './domain-event.entity'
import type { Logger } from 'winston'
import type { DataSource, EntityManager } from 'typeorm'
import { CouchbaseDocument, CouchbaseDocumentType } from './couchbase-document.entity'
import { subscribeToCommand } from '../listeners'
import type { saveDocumentsCommandHandler as saveDocumentsHandlerFactory } from './save-documents-command-handler'
import type {
  importOwnerCommandHandler as importOwnerHandlerFactory
} from '../../owner/service/import-owner-command-handler'
import { ProposalProps } from '../../building/building'
import { Proposal } from '../../building/proposal.entity'
import { oldProposalToEntityStatus } from '../../building/repository/postgres-proposals.repository'
import { BuildingImagesImporterService } from '../service/building-images-importer.service'

interface Deps {
  eventBus: EventBus,
  logger: Logger,
  ormDataSource: DataSource,
  entityManager: EntityManager,
  saveDocumentsCommandHandler: ReturnType<typeof saveDocumentsHandlerFactory>
  importOwnerCommandHandler: ReturnType<typeof importOwnerHandlerFactory>

  buildingImagesImporterService: BuildingImagesImporterService,
}

export function couchbaseToPostgresSaga ({
                                           eventBus,
                                           logger,
                                           entityManager,
                                           saveDocumentsCommandHandler,
                                           importOwnerCommandHandler,
                                           buildingImagesImporterService,
                                         }: Deps) {
  eventBus.on(
    DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
    'postgres_migration.trigger_building_owners_migration',
    async ({ buildingId }: { buildingId: string }) => {
      logger.info('Building imported, triggering owners migration', { buildingId })
      const allOwners = await entityManager
        .createQueryBuilder(CouchbaseDocument, 'owner')
        .where("owner.document ->> 'buildingId' = :buildingId", { buildingId })
        .andWhere('owner.documentType = :documentType', { documentType: CouchbaseDocumentType.OWNER })
        .select([ 'owner.id', 'owner.document' ])
        .getMany()

      logger.info('Found owners for building', { buildingId, count: allOwners.length })

      for (const owner of allOwners) {
        await eventBus.publish({
          name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
          buildingId,
          owner: owner.document,
        })
        logger.info('Owner migration triggered', { buildingId, ownerId: owner.id })
      }
      logger.info('Owner migration triggered for all owners', { buildingId })
    }
  )

  eventBus.on(
    DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
    'postgres_migration.import_building_images',
    async ({ buildingId }: { buildingId: string }) => {
      await buildingImagesImporterService.importBuildingImages(buildingId)
    }
  )

  eventBus.on(
    DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
    'postgres_migration.import_building_proposals',
    async ({ buildingId }: { buildingId: string }) => {
      logger.info('Building imported, importing its proposals', { buildingId })
      const proposals = await entityManager
        .createQueryBuilder(CouchbaseDocument, 'proposal')
        .where("proposal.document ->> 'buildingId' = :buildingId", { buildingId })
        .andWhere('proposal.documentType = :documentType', { documentType: CouchbaseDocumentType.BUILDING_PROPOSAL })
        .getMany()

      logger.info('Found proposals for building', { buildingId, count: proposals.length })

      await entityManager.transaction(async em => {
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

        await eventBus.publish({
          name: DomainEventCatalog.BUILDING__BUILDING_IMAGES_IMPORTED,
          buildingId,
          proposals: proposals.map(i => i.id),
        }, em)
      })

      logger.info('All building proposals imported', { buildingId })
    }
  )

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__SAVE_DOCUMENTS,
    eventBus,
    saveDocumentsCommandHandler,
  )

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
    eventBus,
    importOwnerCommandHandler,
  )

  return {
    async triggerBuildingMigration () {
      logger.info('Triggering building migration')
      const allBuildings = await entityManager.findBy(CouchbaseDocument, { documentType: CouchbaseDocumentType.BUILDING })
      logger.info('Found buildings', { count: allBuildings.length })
      for (const building of allBuildings) {
        await eventBus.publish({
          name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_BUILDING,
          building: building.document,
        })
        logger.info('Building migration triggered', { buildingId: building.id })
      }
      logger.info('Building migration triggered for all buildings')
    }
  }
}
