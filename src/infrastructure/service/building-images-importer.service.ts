import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { BuildingMetadataProps } from '../../building/building'
import { BuildingImage } from '../../building/building-image.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { EventPublisher } from '../event-bus'
import { Logger } from 'winston'

export class BuildingImagesImporterService {
  constructor (
    private readonly entityManager: EntityManager,
    private readonly eventBus: EventPublisher,
    private readonly logger: Logger,
  ) {
  }

  async importBuildingImages (buildingId: string) {
    this.logger.info('Building imported, starting to import its images', { buildingId })
    const images = await this.entityManager
      .createQueryBuilder(CouchbaseDocument, 'metadata')
      .where("metadata.document ->> 'buildingId' = :buildingId", { buildingId })
      .andWhere('metadata.documentType = :documentType', { documentType: CouchbaseDocumentType.METADATA })
      .getMany()

    this.logger.info('Found images for building', { buildingId, count: images.length })

    await this.entityManager.transaction(async em => {
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

      await this.eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMAGES_IMPORTED,
        buildingId,
        imageIds: images.map(i => i.id),
      }, em)
    })

    this.logger.info('All building images imported', { buildingId })
  }
}
