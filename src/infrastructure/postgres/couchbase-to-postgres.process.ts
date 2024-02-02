import type { EventBus } from '../event-bus'
import { DomainEventCatalog } from './domain-event.entity'
import type { Logger } from 'winston'
import type { DataSource, EntityManager } from 'typeorm'
import { CouchbaseDocument, CouchbaseDocumentType } from './couchbase-document.entity'
import { subscribeToCommand } from '../listeners'
import type { SaveDocumentsCommandHandler } from './save-documents-command-handler'
import type { importOwnerHandlerFactory } from '../../owner/service/import-owner-command-handler'
import { BuildingImagesImporterService } from '../service/building-images-importer.service'
import { importOperatorCommandHandler } from './import-operator-command-handler'
import { BuildingOwnerImportTriggerService } from '../service/building-owner-import-trigger.service'
import { BuildingProposalsImporterService } from '../service/building-proposals-importer.service'
import { BuildingImportTriggerService } from '../service/building-import-trigger.service'
import { BuildingWorkSheetsImporterService } from '../service/building-worksheets-importer.service'
import { ImportScheduledEventHandler } from '../../scheduled-events/service/scheduled-event-importer.service'
import { ScheduledEventImportTriggerService } from '../service/scheduled-event-import-trigger.service'
import { WorksheetQueueImportTriggerService } from './worksheet-queue-import-trigger.service'

interface Deps {
  eventBus: EventBus,
  logger: Logger,
  ormDataSource: DataSource,
  entityManager: EntityManager,
  saveDocumentsCommandHandler: SaveDocumentsCommandHandler
  importOwnerCommandHandler: ReturnType<typeof importOwnerHandlerFactory>
  importScheduledEventCommandHandler: ImportScheduledEventHandler

  buildingImportTriggerService: BuildingImportTriggerService,
  scheduledEventImportTriggerService: ScheduledEventImportTriggerService,
  worksheetQueueImportTriggerService: WorksheetQueueImportTriggerService,
  buildingImagesImporterService: BuildingImagesImporterService,
  importOperatorCommandHandler: ReturnType<typeof importOperatorCommandHandler>,
  buildingOwnerImportTriggerService: BuildingOwnerImportTriggerService,
  buildingProposalsImporterService: BuildingProposalsImporterService,
  buildingWorkSheetsImporterService: BuildingWorkSheetsImporterService,
}

export function couchbaseToPostgresProcess ({
  eventBus,
  logger,
  entityManager,
  saveDocumentsCommandHandler,
  importOwnerCommandHandler,
  importScheduledEventCommandHandler,
  buildingImportTriggerService,
  worksheetQueueImportTriggerService,
  scheduledEventImportTriggerService,
  buildingImagesImporterService,
  buildingOwnerImportTriggerService,
  buildingProposalsImporterService,
  buildingWorkSheetsImporterService
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
    'postgres_migration.import_building_worksheets',
    async ({ buildingId }: { buildingId: string }) => {
      await buildingWorkSheetsImporterService.importWorkSheet(buildingId)
    }
  )

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__SAVE_DOCUMENTS,
    eventBus,
    saveDocumentsCommandHandler
  )

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
    eventBus,
    importOwnerCommandHandler
  )

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_SCHEDULED_EVENT,
    eventBus,
    importScheduledEventCommandHandler
  )

  subscribeToCommand(
    DomainEventCatalog.CMD__POSTGRES_MIGRATION__IMPORT_BUILDING_PROPOSAL,
    eventBus,
    async ({ buildingId }: { buildingId: string }) => {
      await buildingProposalsImporterService.importBuildingProposal(buildingId)
    }
  )

  return {
    async triggerBuildingMigration () {
      await buildingImportTriggerService.triggerImport(parseInt(process.env.BUILDING_MIGRATION_LIMIT) || 1000)
    },
    async triggerScheduledEventMigration () {
      await scheduledEventImportTriggerService.triggerImport()
    },
    async triggerWorksheetQueueImport () {
      await worksheetQueueImportTriggerService.triggerImport()
    },
    async triggerOperatorsMigration () {
      logger.info('Triggering operators migration')
      const allOperators = await entityManager
        .createQueryBuilder(CouchbaseDocument, 'operator')
        .andWhere('operator.documentType = :documentType', { documentType: CouchbaseDocumentType.OPERATOR })
        .select(['operator.id', 'operator.document'])
        .getMany()
      logger.info('Found operators', { count: allOperators.length })

      for (const operator of allOperators) {
        await eventBus.publish({
          name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OPERATOR,
          operator: operator.document
        })
        logger.info('Operator migration triggered', { operatorId: operator.id })
      }
      logger.info('All operators migration triggered')
    }
  }
}
