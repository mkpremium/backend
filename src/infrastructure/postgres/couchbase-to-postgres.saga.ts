import { EventBus } from '../event-bus'
import { DomainEventCatalog } from './domain-event.entity'
import { Logger } from 'winston'
import { DataSource } from 'typeorm'
import { CouchbaseDocument } from './couchbase-document.entity'

interface Deps {
  eventbus: EventBus,
  logger: Logger,
  ormDataSource: DataSource,
}

export function couchbaseToPostgresSaga ({ eventbus, logger, ormDataSource: { manager }, }: Deps) {
  eventbus.on(
    DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
    'postgres_migration__trigger_building_owners_migration',
    async ({ buildingId }: { buildingId: string }) => {
      logger.info('Building imported, triggering owners migration', { buildingId })
      const allOwners = await manager
        .createQueryBuilder(CouchbaseDocument, 'owner')
        .where('owner.document ->> buildingId = :buildingId', { buildingId })
        .andWhere('owner.documentType = :documentType', { documentType: 'owner' })
        .getMany()

      logger.info('Found owners for building', { buildingId, count: allOwners.length })

      for (const owner of allOwners) {
        await eventbus.publish({
          name: DomainEventCatalog.CMD__POSTGRES__MIGRATION__IMPORT_OWNER,
          buildingId,
          ownerId: owner.id,
        })
      }
    }
  )
}
