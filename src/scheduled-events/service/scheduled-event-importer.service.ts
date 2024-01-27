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
import { BuildingOfferRequest } from "../../building/repository/building-offer-request.entity";
import { Flipper } from "../../flipper/flipper.entity";
import { Caller } from "../../caller/caller.entity";

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
        where: {id: scheduledEvent.event.ownerId},
        loadRelationIds: true,
      })
      const createdAt = scheduledEvent.createdAt ?? Date.now();
      if (scheduledEvent.type === 'MEETINGS' && !scheduledEvent.event.inPerson) {
        const flipper = await transactionalManager.findOneByOrFail(Flipper, [
          {user: {id: scheduledEvent.notifyTo}},
        ])
        const caller = await transactionalManager.findOneByOrFail(Caller, [
          {user: {id: scheduledEvent.createdBy}},
        ])
        await transactionalManager.save(BuildingOfferRequest, {
          id: scheduledEvent.id,
          flipper: flipper,
          caller: caller,
          owner: {id: owner.id},
          contact: {id: scheduledEvent.event.contactId},
          building: {id: owner.building as any as string},
          createdAt: createdAt,
          updatedAt: createdAt,
        })
      } else {
        await transactionalManager.save(ScheduledEvent, {
          id: scheduledEvent.id,
          type: scheduledEvent.type === 'CALLS' ? 'CALL' : 'MEETING',
          scheduledFor: scheduledEvent.eventDate,
          notifyTo: {id: scheduledEvent.notifyTo},
          createdBy: {id: scheduledEvent.createdBy},
          building: {id: owner.building as any as string},
          contact: {id: scheduledEvent.event.contactId},
          owner: {id: owner.id},
          createdAt: createdAt,
          updatedAt: createdAt,
        })
      }

      await markCouchbaseDocumentAsMigrated(transactionalManager, scheduledEvent.id)

      await eventBus.publish({
        name: DomainEventCatalog.POSTGRES_MIGRATION__SCHEDULED_EVENT_IMPORTED,
        scheduledEventId: scheduledEvent.id,
      }, transactionalManager)
    })
  }
}
