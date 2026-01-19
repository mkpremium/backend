import { CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EventPublisher } from '../event-bus'
import { Logger } from 'winston'
import { CouchbaseDocumentRepository } from '../postgres/couchbase-document.repository'

export class BuildingOwnerImportTriggerService {
  constructor (
    private readonly eventBus: EventPublisher,
    private readonly logger: Logger,
    private readonly couchbaseDocumentRepository: CouchbaseDocumentRepository
  ) {
  }

  async importBuildingOwners (buildingId: string) {
    this.logger.info('Building imported, triggering owners migration', { buildingId })
    const allOwners = await this.couchbaseDocumentRepository.getBuildingNonMigratedRelatedDocuments(
      CouchbaseDocumentType.OWNER, buildingId)

    this.logger.info('Found owners for building', { buildingId, count: allOwners.length })

    for (const owner of allOwners) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
        buildingId,
        owner: owner.document
      })
      this.logger.info('Owner migration triggered', { buildingId, ownerId: owner.id })
    }
    this.logger.info('Owner migration triggered for all owners', { buildingId })
  }

  async importAllOwners () {
    this.logger.info('Triggering migration for all owners without buildingId filter')
    const allOwners = await this.couchbaseDocumentRepository.getAllNonMigratedOwners()
    this.logger.info('Found owners to migrate', { count: allOwners.length })

    for (const owner of allOwners) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
        // buildingId maybe null or unknown here, si no tienes un buildingId relacionado
        buildingId: null,
        owner: owner.document
      })
      this.logger.info('Owner migration triggered', { ownerId: owner.id })
    }
    this.logger.info('All owner migrations triggered')
  }
}
