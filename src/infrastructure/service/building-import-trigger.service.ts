import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EventPublisher } from '../event-bus'
import { EntityManager } from 'typeorm'
import { Logger } from 'winston'

export class BuildingImportTriggerService {
  constructor (
    private readonly eventBus: EventPublisher,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {
  }

  async triggerImport () {
    this.logger.info('Triggering building migration')
    const allBuildings = await this.entityManager.createQueryBuilder(CouchbaseDocument, 'building')
      .where('building.documentType = :documentType', { documentType: CouchbaseDocumentType.BUILDING })
      .andWhere('building.migratedAt IS NULL')
      .limit(parseInt(process.env[ "BUILDING_MIGRATION_LIMIT" ]) || 1000)
      .getMany()

    this.logger.info('Found buildings', { count: allBuildings.length })
    for (const building of allBuildings) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_BUILDING,
        building: building.document,
      })
      this.logger.info('Building migration triggered', { buildingId: building.id })
    }
    this.logger.info('Building migration triggered for all buildings')
  }
}
