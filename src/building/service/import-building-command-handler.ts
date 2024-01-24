import { BuildingProps } from '../building'
import { EntityManager } from 'typeorm'
import { Building } from '../building.entity'
import { mapBuildingStructToEntity } from '../repository/postgres-buildings.repository'
import { Logger } from 'winston'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import {
  getCouchbaseDocument,
  markCouchbaseDocumentAsMigrated
} from '../../infrastructure/postgres/get-couchbase-document'
import { Flipper } from '../../flipper/flipper.entity'

interface Deps {
  entityManager: EntityManager,
  logger: Logger,
  eventBus: EventPublisher,
}

export function importBuildingCommandHandler ({ entityManager, logger, eventBus }: Deps) {
  return async function ({ building }: { building: BuildingProps }) {
    logger.info('Importing building', { building })
    await entityManager.transaction(async em => {
      const couchbaseDocument = await getCouchbaseDocument(em, building.id)
      if (couchbaseDocument.migratedAt) {
        logger.warning('Building already migrated', { buildingId: building.id })
        return
      }

      let flipperId: string | undefined
      if (building.assignedAgentId) {
        const flipper = await entityManager.findOneByOrFail(Flipper,
          { user: { id: building.assignedAgentId } },
        )
        flipperId = flipper.id
      }
      // Ensure there is no building with a featured owner as they aren't imported yet.
      await em.save(Building, mapBuildingStructToEntity({ ...building, ownerId: undefined, assignedAgentId: flipperId }))
      await markCouchbaseDocumentAsMigrated(em, building.id)

      await eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
        buildingId: building.id
      }, em)
    })
  }
}
