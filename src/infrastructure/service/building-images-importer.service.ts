import { CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { BuildingMetadataProps } from '../../building/building'
import { BuildingDocument, BuildingDocumentMimeType } from '../../building/building-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { EventPublisher } from '../event-bus'
import { Logger } from 'winston'
import { getCouchbaseDocument, markCouchbaseDocumentAsMigrated } from '../postgres/get-couchbase-document'
import { CouchbaseDocumentRepository } from '../postgres/couchbase-document.repository'

export class BuildingImagesImporterService {
  constructor (
    protected readonly entityManager: EntityManager,
    private readonly eventBus: EventPublisher,
    private readonly logger: Logger,
    private readonly couchbaseDocumentRepository: CouchbaseDocumentRepository
  ) {
  }

  async importBuildingImages (buildingId: string) {
    this.logger.info('Building imported, starting to import its documents', { buildingId })
    const documents = await this.couchbaseDocumentRepository.getBuildingNonMigratedRelatedDocuments(
      CouchbaseDocumentType.METADATA, buildingId)

    this.logger.info('Found documents for building', { buildingId, count: documents.length })

    await this.entityManager.transaction(async em => {
      for (const document of documents) {
        const couchbaseDocument = await getCouchbaseDocument(em, document.id)
        if (couchbaseDocument.migratedAt) {
          this.logger.info('Image already migrated, skipping', { buildingId, imageId: document.id })
          continue
        }

        const original = document.document as BuildingMetadataProps
        await em.save(BuildingDocument, {
          id: document.id,
          name: original.name,
          mimeType: original.mimeType as BuildingDocumentMimeType,
          privateUrl: original.url,
          previewUrl: original.previewUrl,
          building: { id: buildingId }
        })
        await markCouchbaseDocumentAsMigrated(em, document.id)
      }

      await this.eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMAGES_IMPORTED,
        buildingId,
        imageIds: documents.map(i => i.id)
      }, em)
    })

    this.logger.info('All building documents imported', { buildingId })
  }
}
