import { EventPublisher } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import { EntityManager } from 'typeorm'
import {
  getCouchbaseDocument,
  markCouchbaseDocumentAsMigrated
} from '../../infrastructure/postgres/get-couchbase-document'
import { WorksheetQueueProps } from '../domain/queue'
import { WorksheetQueue } from '../worksheet-queue.entity'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

interface Deps {
  entityManager: EntityManager,
  logger: Logger,
  eventBus: EventPublisher,
}

export function importWorksheetQueueHandlerFactory ({ eventBus, logger, entityManager }: Deps) {
  return async function importWorksheetQueueHandler ({ worksheetQueueId }: { worksheetQueueId: string
    s }) {
    logger.info('Importing WorksheetQueue', { worksheetQueueId })

    await entityManager.transaction(async em => {
      // Get the Couchbase document for the WorksheetQueue
      const couchbaseDocument = await getCouchbaseDocument(em, worksheetQueueId)

      // Check if the document has already been migrated
      if (couchbaseDocument.migratedAt) {
        // If it has, log a warning and return early
        logger.warning('WorksheetQueue already migrated', { worksheetQueueId })
        return
      }

      const worksheetQueue = couchbaseDocument.document as WorksheetQueueProps
      await em.save(WorksheetQueue, {
        id: couchbaseDocument.id,
        name: worksheetQueue.name,
        source: worksheetQueue.source
      })
      await markCouchbaseDocumentAsMigrated(em, worksheetQueue.id)

      await eventBus.publish({
        name: DomainEventCatalog.POSTGRES_MIGRATION__WORKSHEET_QUEUE_IMPORTED,
        worksheetQueueId: worksheetQueue.id
      }, em)
    })
  }
}
