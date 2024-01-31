import { EntityManager } from 'typeorm'
import { Logger } from 'winston'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import {
  getCouchbaseDocument,
  markCouchbaseDocumentAsMigrated
} from '../../infrastructure/postgres/get-couchbase-document'
import { ScheduledEventProps } from '../types'
import { ScheduledEvent } from '../scheduled-event.entity'
import { Owner } from '../../owner/owner.entity'
import { BuildingOfferRequest } from '../../building/repository/building-offer-request.entity'
import { Flipper } from '../../flipper/flipper.entity'
import { Caller } from '../../caller/caller.entity'
import { Building } from '../../building/building.entity'
import { OwnerProps } from '../../owner/owner'
import { Contact } from '../../contacts/contact.entity'

interface Deps {
  entityManager: EntityManager,
  logger: Logger,
  eventBus: EventPublisher,
}

export type ImportScheduledEventHandler = ReturnType<typeof importScheduledEventHandlerFactory>

export function importScheduledEventHandlerFactory ({ eventBus, logger, entityManager }: Deps) {
  return async function importScheduledEventHandler ({ scheduledEvent }: {
    scheduledEvent: Omit<ScheduledEventProps, 'createdAt'> & { createdAt: string }
  }) {
    logger.info('Importing scheduled event', { scheduledEvent })
    const owner = await entityManager.findOneOrFail(Owner, {
      where: { id: scheduledEvent.event.ownerId },
      loadRelationIds: true
    })

    const couchbaseOwnerDocument = await getCouchbaseDocument(entityManager, owner.id)
    const couchbaseContact = (couchbaseOwnerDocument.document as OwnerProps).person.contacts
      .find(c => c.id === scheduledEvent.event.contactId)
    const contact = await entityManager.findOneBy(Contact, { value: couchbaseContact.value })

    await entityManager.transaction(async transactionalManager => {
      const couchbaseDocument = await getCouchbaseDocument(transactionalManager, scheduledEvent.id)
      if (couchbaseDocument.migratedAt) {
        logger.warning('Scheduled event already migrated', { scheduledEventId: scheduledEvent.id })
        return
      }
      const createdAt = scheduledEvent.createdAt || Date.now()
      if (scheduledEvent.type === 'MEETINGS' && !scheduledEvent.event.inPerson) {
        await importBuildingOfferRequest(transactionalManager, scheduledEvent, owner, contact, createdAt as string)
      } else {
        await importScheduledEvent(transactionalManager, scheduledEvent, owner, contact, createdAt as string)
      }

      await markCouchbaseDocumentAsMigrated(transactionalManager, scheduledEvent.id)

      await eventBus.publish({
        name: DomainEventCatalog.POSTGRES_MIGRATION__SCHEDULED_EVENT_IMPORTED,
        scheduledEventId: scheduledEvent.id
      }, transactionalManager)
    })
  }
}

async function importBuildingOfferRequest (entityManager: EntityManager, scheduledEvent: Omit<ScheduledEventProps, 'createdAt'> & {
  createdAt: string
}, owner: { id: string, building: Building }, contact: Contact, createdAt: string) {
  const flipper = await entityManager.findOneByOrFail(Flipper, [
    { user: { id: scheduledEvent.notifyTo } }
  ])
  const caller = await entityManager.findOneByOrFail(Caller, [
    { user: { id: scheduledEvent.createdBy } }
  ])

  await entityManager.save(BuildingOfferRequest, {
    id: scheduledEvent.id,
    flipper,
    caller,
    owner: { id: owner.id },
    building: { id: owner.building as unknown as string },
    contact,
    createdAt,
    updatedAt: createdAt
  })
}

async function importScheduledEvent (transactionalManager: EntityManager, scheduledEvent: Omit<ScheduledEventProps, 'createdAt'> & {
  createdAt: string
}, owner: { id: string, building: Building }, contact: Contact, createdAt: string) {
  await transactionalManager.save(ScheduledEvent, {
    id: scheduledEvent.id,
    type: scheduledEvent.type === 'CALLS' ? 'CALL' : 'MEETING',
    scheduledFor: scheduledEvent.eventDate,
    notifyTo: { id: scheduledEvent.notifyTo },
    createdBy: { id: scheduledEvent.createdBy },
    building: { id: owner.building as unknown as string },
    contact,
    owner: { id: owner.id },
    createdAt,
    updatedAt: createdAt
  })
}
