import { BuildingProps } from '../building'
import { DataSource } from 'typeorm'
import { Building } from '../building.entity'
import { mapBuildingStructToEntity } from '../repository/postgres-buildings.repository'
import { Logger } from 'winston'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

interface Deps {
  ormDataSource: DataSource,
  logger: Logger,
  eventBus: EventPublisher,
}

export function importBuildingCommandHandler ({ ormDataSource, logger, eventBus }: Deps) {
  return async function ({ building }: { building: BuildingProps }) {
    logger.info('Importing building', { building })
    await ormDataSource.transaction(async entityManager => {
      // Ensure there is no building with a featured owner as they aren't imported yet.
      await entityManager.save(Building, mapBuildingStructToEntity({ ...building, ownerId: undefined }))

      await eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
        buildingId: building.id
      }, entityManager)
    })
  }
}
