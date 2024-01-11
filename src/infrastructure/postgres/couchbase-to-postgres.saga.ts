import type { EventBus } from '../event-bus'
import { DomainEventCatalog } from './domain-event.entity'
import type { Logger } from 'winston'
import type { DataSource } from 'typeorm'
import { CouchbaseDocument, CouchbaseDocumentType } from './couchbase-document.entity'
import { subscribeToCommand } from '../listeners'
import type { saveDocumentsCommandHandler as saveDocumentsHandlerFactory } from './save-documents-command-handler'
import type {
  importOwnerCommandHandler as importOwnerHandlerFactory
} from '../../owner/service/import-owner-command-handler'
import { BuildingMetadataProps } from '../../building/building'
import { BuildingImage } from '../../building/building-image.entity'

interface Deps {
  eventBus: EventBus,
  logger: Logger,
  ormDataSource: DataSource,
  saveDocumentsCommandHandler: ReturnType<typeof saveDocumentsHandlerFactory>
  importOwnerCommandHandler: ReturnType<typeof importOwnerHandlerFactory>
}

export function couchbaseToPostgresSaga ({
                                           eventBus,
                                           logger,
                                           ormDataSource: { manager },
                                           saveDocumentsCommandHandler,
                                           importOwnerCommandHandler,
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

  eventBus.on(
    DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
    'postgres_migration.trigger_building_images_migration',
    async ({ buildingId }: { buildingId: string }) => {
      logger.info('Building imported, triggering images migration', { buildingId })
      const images = await manager
        .createQueryBuilder(CouchbaseDocument, 'metadata')
        .where('metadata.document ->> buildingId = :buildingId', { buildingId })
        .andWhere('metadata.documentType = :documentType', { documentType: CouchbaseDocumentType.METADATA })
        .getMany()

      logger.info('Found images for building', { buildingId, count: images.length })

      await manager.transaction(async em => {
        for (const image of images) {
          const original = image.document as BuildingMetadataProps
          await em.save(BuildingImage, {
            id: image.id,
            name: original.name,
            mimeType: original.mimeType,
            previewUrl: original.previewUrl,
            building: { id: buildingId },
          })
        }

        await eventBus.publish({
          name: DomainEventCatalog.BUILDING__BUILDING_IMAGES_IMPORTED,
          buildingId,
          imageIds: images.map(i => i.id),
        }, em)
      })

      logger.info('Images migration triggered for all images', { buildingId })
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
