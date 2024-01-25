import { OwnerProps } from '../owner'
import { EventPublisher } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import { EntityManager } from 'typeorm'
import { AddOwnerCommand, AddOwnerService } from './add-owner.service'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { CouchbaseDocument, CouchbaseDocumentType } from '../../infrastructure/postgres/couchbase-document.entity'
import { BuildingProps } from '../../building/building'
import { Building } from '../../building/building.entity'
import {
  getCouchbaseDocument,
  markCouchbaseDocumentAsMigrated
} from '../../infrastructure/postgres/get-couchbase-document'

interface Deps {
  entityManager: EntityManager,
  logger: Logger,
  eventBus: EventPublisher,
  addOwnerService: AddOwnerService,
}

export function importOwnerHandlerFactory ({ addOwnerService, eventBus, logger, entityManager }: Deps) {
  return async function ({ owner }: { owner: OwnerProps }) {
    logger.info('Importing owner', { owner })
    const couchbaseDocument = await getCouchbaseDocument(entityManager, owner.id)
    if (couchbaseDocument.migratedAt) {
      logger.warning('Owner already migrated', { ownerId: owner.id })
      return
    }

    const ownerWithNames = ensureOwnerHasNames(owner)
    await addOwnerService.addOwner({ ...ownerWithNames, note: 'Importado desde Couchase' } as AddOwnerCommand, 'system')
    await markCouchbaseDocumentAsMigrated(entityManager, owner.id)
    await eventBus.publish({
      name: DomainEventCatalog.POSTGRES_MIGRATION__OWNER_IMPORTED,
      ownerId: owner.id,
    }, entityManager)

    if (!owner.buildingId) {
      logger.warning('Owner has no building', { ownerId: owner.id })
      return
    }

    const couchbaseBuilding = await entityManager.findOneBy(CouchbaseDocument, {
      documentType: CouchbaseDocumentType.BUILDING,
      id: owner.buildingId,
    })
    if (!couchbaseBuilding) {
      logger.error('Building not found (importing owner)', { buildingId: owner.buildingId })
      return
    }
    const building = couchbaseBuilding.document as BuildingProps
    if (building.ownerId && building.ownerId === owner.id) {
      logger.info('Setting featured building owner', { buildingId: building.id, ownerId: owner.id })
      await entityManager.update(Building, { id: building.id }, { featuredOwner: { id: owner.id } })
    }
  }
}

function ensureOwnerHasNames (owner: OwnerProps) {
  if (owner.person.firstName && owner.person.firstSurname) return owner

  const [firstName, ...rest] = owner.name.split(' ')

  return {
    ...owner,
    person: {
      ...owner.person,
      firstName: firstName,
      firstSurname: rest.join(' '),
    }
  }
}
