import { EventBus } from '../event-bus'
import { DomainEventCatalog } from './domain-event.entity'
import type { Logger } from 'winston'
import { CouchbaseDocumentRepository } from './couchbase-document.repository'
import { CouchbaseDocumentType } from './couchbase-document.entity'

export class WorksheetQueueImportTriggerService {
  constructor(
    private eventBus: EventBus,
    private logger: Logger,
    private couchbaseDocumentRepository: CouchbaseDocumentRepository
  ) {
  }

  async triggerImport() {
    const worksheetQueuesToMigrate = await this.couchbaseDocumentRepository
      .getNonMigratedQuery(CouchbaseDocumentType.WORKSHEET_QUEUE)
      .getMany()

    this.logger.info('Triggering WorksheetQueue import', {count: worksheetQueuesToMigrate.length})
    for (const row of worksheetQueuesToMigrate) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES_MIGRATION__IMPORT_WORKSHEET_QUEUE,
        worksheetQueueId: row.id,
      })
      this.logger.info('WorksheetQueue import triggered', {worksheetQueueId: row.id})
    }
    this.logger.info('All worksheet queues triggered.')
  }

}
