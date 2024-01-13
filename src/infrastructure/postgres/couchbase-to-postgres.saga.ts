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
import { importOperatorCommandHandler } from './import-operator-command-handler'
import { Building } from '../../building/building.entity'
import { BuildingOwnerImportTriggerService } from '../service/building-owner-import-trigger.service'
import { BuildingProposalsImporterService } from '../service/building-proposals-importer.service'
import { BuildingImportTriggerService } from '../service/building-import-trigger.service'

interface Deps {
  eventBus: EventBus,
  logger: Logger,
  ormDataSource: DataSource,
  entityManager: EntityManager,
  saveDocumentsCommandHandler: ReturnType<typeof saveDocumentsHandlerFactory>
  importOwnerCommandHandler: ReturnType<typeof importOwnerHandlerFactory>

  buildingImportTriggerService: BuildingImportTriggerService,
  buildingImagesImporterService: BuildingImagesImporterService,
  importOperatorCommandHandler: ReturnType<typeof importOperatorCommandHandler>,
  buildingOwnerImportTriggerService: BuildingOwnerImportTriggerService,
  buildingProposalsImporterService: BuildingProposalsImporterService,
}

export function couchbaseToPostgresSaga ({
                                           eventBus,
                                           logger,
                                           entityManager,
                                           saveDocumentsCommandHandler,
                                           importOwnerCommandHandler,
                                           buildingImportTriggerService,
                                           buildingImagesImporterService,
                                           buildingOwnerImportTriggerService,
                                           buildingProposalsImporterService,
                                         }: Deps) {
  eventBus.on(
    DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
    'postgres_migration.trigger_building_owners_migration',
    async ({ buildingId }: { buildingId: string }) => {
      await buildingOwnerImportTriggerService.importBuildingOwners(buildingId)
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
      await buildingProposalsImporterService.importBuildingProposal(buildingId)
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
      await buildingImportTriggerService.triggerImport()
    },
    async triggerOperatorsMigration () {
      logger.info('Triggering operators migration')
      const allOperators = await entityManager
        .createQueryBuilder(CouchbaseDocument, 'operator')
        .andWhere('operator.documentType = :documentType', { documentType: CouchbaseDocumentType.OPERATOR })
        .select([ 'operator.id', 'operator.document' ])
        .getMany()
      logger.info('Found operators', { count: allOperators.length })

      for (const operator of allOperators) {
        await eventBus.publish({
          name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OPERATOR,
          operator: operator.document,
        })
        logger.info('Operator migration triggered', { operatorId: operator.id })
      }
      logger.info('All operators migration triggered')
    },
  }
}
