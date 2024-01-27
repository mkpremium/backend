import { CouchbaseDocument, CouchbaseDocumentType } from '../postgres/couchbase-document.entity'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { EventPublisher } from '../event-bus'
import { EntityManager } from 'typeorm'
import { Logger } from 'winston'

export class ScheduledEventImportTriggerService {
  constructor (
    private readonly eventBus: EventPublisher,
    private readonly entityManager: EntityManager,
    private readonly logger: Logger,
  ) {
  }

  async triggerImport () {
    this.logger.info('Triggering scheduled events migration')
    const allScheduledEvents = await this.entityManager.createQueryBuilder(CouchbaseDocument, 'scheduledEvent')
      .where('scheduledEvent.documentType = :documentType', { documentType: CouchbaseDocumentType.SCHEDULED_EVENT })
      .andWhere('scheduledEvent.migratedAt IS NULL')
      .getMany()

    this.logger.info('Found scheduled events', { count: allScheduledEvents.length })
    for (const scheduledEvent of allScheduledEvents) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_SCHEDULED_EVENT,
        scheduledEvent: scheduledEvent.document,
      })
      this.logger.info('Scheduled event migration triggered', { scheduledEventId: scheduledEvent.id })
    }
    this.logger.info('Scheduled event migration triggered for all scheduled events')
  }
}
