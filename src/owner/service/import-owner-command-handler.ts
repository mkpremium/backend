import { OwnerProps } from '../owner'
import { EventPublisher } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import { DataSource } from 'typeorm'
import { AddOwnerCommand, AddOwnerService } from './add-owner.service'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

interface Deps {
  ormDataSource: DataSource,
  logger: Logger,
  eventBus: EventPublisher,
  addOwnerService: AddOwnerService,
}

export function importOwnerCommandHandler ({ addOwnerService, logger, eventBus }: Deps) {
  return async function ({ owner }: { owner: OwnerProps }) {
    logger.info('Importing owner', { owner })
    await addOwnerService.addOwner({ ...owner, note: 'Importado desde Couchase' } as AddOwnerCommand, 'system')
    await eventBus.publish({
      name: DomainEventCatalog.POSTGRES_MIGRATION__OWNER_IMPORTED,
      ownerId: owner.id,
    })
  }
}
