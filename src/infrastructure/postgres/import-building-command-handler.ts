import { BuildingProps } from '../../building/building'
import { DataSource } from 'typeorm'
import { Building } from '../../building/building.entity'
import { mapBuildingStructToEntity } from '../../building/repository/postgres-buildings.repository'
import { Logger } from 'winston'
import { EventPublisher } from '../event-bus'
import { DomainEventCatalog } from './domain-event.entity'

interface Deps {
  ormDataSource: DataSource,
  logger: Logger,
  eventBus: EventPublisher,
}

export function importBuildingCommandHandler ({ ormDataSource, logger, eventBus }: Deps) {
  return async function ({ building }: { building: BuildingProps }) {
    logger.info('Importing building', { building })
    await ormDataSource.transaction(async entityManager => {
      await entityManager.save(Building, mapBuildingStructToEntity(building))

      await eventBus.publish({
        name: DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
        buildingId: building.id
      }, entityManager)
    })
  }
}
