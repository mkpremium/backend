import { EntityManager } from "typeorm";
import { Logger } from 'winston';
import { EventPublisher } from '../../infrastructure/event-bus';
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity';
import {
  getCouchbaseDocument,
  markCouchbaseDocumentAsMigrated
} from '../../infrastructure/postgres/get-couchbase-document';
import { ScheduledEventProps } from "../types";
import { ScheduledEvent } from "../scheduled-event.entity";
import { Owner } from "../../owner/owner.entity";

interface Deps {
  entityManager: EntityManager,
  logger: Logger,
  eventBus: EventPublisher,
}

export type ImportScheduledEventHandler = ReturnType<typeof importScheduledEventHandlerFactory>
export function importScheduledEventHandlerFactory({eventBus, logger, entityManager}: Deps) {
  return async function importScheduledEventHandler({scheduledEvent}: {
    scheduledEvent: Omit<ScheduledEventProps, 'createdAt'> & { createdAt: string }
  }) {
    logger.info('Importing scheduled event', {scheduledEvent})
    await entityManager.transaction(async transactionalManager => {
      const couchbaseDocument = await getCouchbaseDocument(transactionalManager, scheduledEvent.id)
      if (couchbaseDocument.migratedAt) {
        logger.warning('Scheduled event already migrated', {scheduledEventId: scheduledEvent.id})
        return
      }

      const owner = await transactionalManager.findOneOrFail(Owner, {
        where: {id: scheduledEvent.event.ownerId },
        loadRelationIds: true,
      })
      await transactionalManager.save(ScheduledEvent, {
        id: scheduledEvent.id,
        type: 'CALL',
        scheduledFor: scheduledEvent.eventDate,
        notifyTo: { id: scheduledEvent.notifyTo },
        createdBy: { id: scheduledEvent.createdBy },
        building: { id: owner.building as any as string },
        contact: { id: scheduledEvent.event.contactId },
        owner: { id: owner.id },
      })

      await markCouchbaseDocumentAsMigrated(transactionalManager, scheduledEvent.id)

      await eventBus.publish({
        name: DomainEventCatalog.POSTGRES_MIGRATION__SCHEDULED_EVENT_IMPORTED,
        scheduledEventId: scheduledEvent.id,
      }, transactionalManager)
    })
  }
}
