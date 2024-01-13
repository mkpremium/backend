import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EventPublisher } from '../event-bus'
import { EntityManager } from 'typeorm'
import { Logger } from 'winston'

export class BuildingOwnerImportTriggerService {
  constructor (
    private readonly eventBus: EventPublisher,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {}

  async importBuildingOwners (buildingId: string) {
    this.logger.info('Building imported, triggering owners migration', { buildingId })
    const allOwners = await this.entityManager
      .createQueryBuilder(CouchbaseDocument, 'owner')
      .where('owner.document ->> \'buildingId\' = :buildingId', { buildingId })
      .andWhere('owner.documentType = :documentType', { documentType: CouchbaseDocumentType.OWNER })
      .select([ 'owner.id', 'owner.document' ])
      .getMany()

    this.logger.info('Found owners for building', { buildingId, count: allOwners.length })

    for (const owner of allOwners) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
        buildingId,
        owner: owner.document,
      })
      this.logger.info('Owner migration triggered', { buildingId, ownerId: owner.id })
    }
    this.logger.info('Owner migration triggered for all owners', { buildingId })
  }
}
