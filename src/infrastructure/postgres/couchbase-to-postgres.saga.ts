import { EventBus } from '../event-bus'
import { DomainEventCatalog } from './domain-event.entity'
import { Logger } from 'winston'
import { DataSource } from 'typeorm'
import { CouchbaseDocument, CouchbaseDocumentType } from './couchbase-document.entity'
import { subscribeToCommand } from '../listeners'
import { saveDocumentsCommandHandler } from './save-documents-command-handler'
import { importOwnerCommandHandler } from '../../owner/service/import-owner-command-handler'

interface Deps {
  eventBus: EventBus,
  logger: Logger,
  ormDataSource: DataSource,
  saveDocumentsCommandHandler: ReturnType<typeof saveDocumentsCommandHandler>
  importOwnerCommandHandler:  ReturnType<typeof importOwnerCommandHandler>
}

export function couchbaseToPostgresSaga ({
                                           eventBus,
                                           logger,
                                           ormDataSource: { manager },
                                           saveDocumentsCommandHandler
                                         }: Deps) {
  eventBus.on(
    DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
    'postgres_migration.trigger_building_owners_migration',
    async ({ buildingId }: { buildingId: string }) => {
      logger.info('Building imported, triggering owners migration', { buildingId })
      const allOwners = await manager
        .createQueryBuilder(CouchbaseDocument, 'owner')
        .where('owner.document ->> buildingId = :buildingId', { buildingId })
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
      const allBuildings = await manager.findBy(CouchbaseDocument, { documentType: CouchbaseDocumentType.BUILDING })
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
