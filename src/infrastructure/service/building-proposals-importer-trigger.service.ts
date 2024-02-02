import { EventBus } from '../event-bus'
import { EntityManager } from 'typeorm'
import type { Logger } from 'winston'
import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'

export class BuildingProposalsImportTriggerService {
  constructor (
    private eventBus: EventBus,
    private entityManager: EntityManager,
    private logger: Logger
  ) {}

  async triggerImport () {
    this.logger.info('Triggering building proposals import')

    const allBuildings = await this.entityManager
      .createQueryBuilder(CouchbaseDocument, 'building')
      .andWhere('building.documentType = :documentType', { documentType: CouchbaseDocumentType.BUILDING })
      .select(['building.id', 'building.document'])
      .getMany()

    this.logger.info('Found buildings', { count: allBuildings.length })

    for (const building of allBuildings) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES_MIGRATION__IMPORT_BUILDING_PROPOSAL,
        buildingId: building.id
      })

      this.logger.info('Building proposals import triggered', { buildingId: building.id })
    }

    this.logger.info('All building proposals import triggered')
  }
}
