import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { BuildingMetadataProps } from '../../building/building'
import { BuildingImage } from '../../building/building-image.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { EventPublisher } from '../event-bus'
import { Logger } from 'winston'
import { BuildingRelatedDocumentMigration } from './building-related-document-migration'
import { getCouchbaseDocument, markCouchbaseDocumentAsMigrated } from '../postgres/get-couchbase-document'

export class BuildingImagesImporterService extends BuildingRelatedDocumentMigration {
  constructor (
    protected readonly entityManager: EntityManager,
    private readonly eventBus: EventPublisher,
    private readonly logger: Logger,
  ) {
    super(entityManager)
  }

  async importBuildingImages (buildingId: string) {
    this.logger.info('Building imported, starting to import its images', { buildingId })
    const images = await this.getBuildingNonMigratedRelatedDocuments(
      CouchbaseDocumentType.METADATA, buildingId)

    this.logger.info('Found images for building', { buildingId, count: images.length })

    await this.entityManager.transaction(async em => {
      for (const image of images) {

        const couchbaseDocument = await getCouchbaseDocument(em, image.id)
        if (couchbaseDocument.migratedAt) {
          this.logger.info('Image already migrated, skipping', { buildingId, imageId: image.id })
          continue
        }

        const original = image.document as BuildingMetadataProps
        await em.save(BuildingImage, {
          id: image.id,
          name: original.name,
          mimeType: original.mimeType,
          previewUrl: original.previewUrl,
          building: { id: buildingId },
        })
        await markCouchbaseDocumentAsMigrated(em, image.id)
      }

      await this.eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMAGES_IMPORTED,
        buildingId,
        imageIds: images.map(i => i.id),
      }, em)
    })

    this.logger.info('All building images imported', { buildingId })
  }
}
