import { OwnerProps } from '../owner'
import { EventPublisher } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import { DataSource } from 'typeorm'
import { AddOwnerCommand, AddOwnerService } from './add-owner.service'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { CouchbaseDocument, CouchbaseDocumentType } from '../../infrastructure/postgres/couchbase-document.entity'
import { BuildingProps } from '../../building/building'
import { Building } from '../../building/building.entity'

interface Deps {
  ormDataSource: DataSource,
  logger: Logger,
  eventBus: EventPublisher,
  addOwnerService: AddOwnerService,
}

export function importOwnerCommandHandler ({ addOwnerService, eventBus, logger, ormDataSource }: Deps) {
  return async function ({ owner }: { owner: OwnerProps }) {
    logger.info('Importing owner', { owner })
    await addOwnerService.addOwner({ ...owner, note: 'Importado desde Couchase' } as AddOwnerCommand, 'system')
    await eventBus.publish({
      name: DomainEventCatalog.POSTGRES_MIGRATION__OWNER_IMPORTED,
      ownerId: owner.id,
    })
    if (owner.buildingId) {
      const couchbaseBuilding = await ormDataSource.manager.findOneBy(CouchbaseDocument, {
        documentType: CouchbaseDocumentType.BUILDING,
        id: owner.buildingId,
      })
      if (!couchbaseBuilding) {
        console.error('Building not found (importing owner)', { buildingId: owner.buildingId })
        return
      }
      const building = couchbaseBuilding.document as BuildingProps
      if (building.ownerId && building.ownerId === owner.id) {
        logger.info('Setting featured building owner', { buildingId: building.id, ownerId: owner.id })
        await ormDataSource.manager.update(Building, { id: building.id }, { featuredOwner: { id: owner.id } })
      }
    }
  }
}
