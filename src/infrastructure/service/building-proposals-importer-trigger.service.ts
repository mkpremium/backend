import { EventBus } from '../event-bus'
import { EntityManager } from 'typeorm'
import type { Logger } from 'winston'
import { DomainEventCatalog } from '../postgres/domain-event.entity'
import { Building } from '../../building/building.entity'

export class BuildingProposalsImportTriggerService {
  constructor (
    private eventBus: EventBus,
    private entityManager: EntityManager,
    private logger: Logger
  ) {}

  async triggerImport () {
    this.logger.info('Triggering building proposals import')

    const allMigratedBuildings = await this.entityManager
      .createQueryBuilder(Building, 'building')
      .select(['building.id'])
      .getMany()

    this.logger.info('Found buildings', { count: allMigratedBuildings.length })

    for (const building of allMigratedBuildings) {
      await this.eventBus.publish({
        name: DomainEventCatalog.CMD__POSTGRES_MIGRATION__IMPORT_BUILDING_PROPOSAL,
        buildingId: building.id
      })

      this.logger.info('Building proposals import triggered', { buildingId: building.id })
    }

    this.logger.info('All building proposals import triggered')
  }
}
