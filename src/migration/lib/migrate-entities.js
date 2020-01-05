import debug from 'debug'
import { BuildingRepository } from '../../building/models'
import { MigrateModelV2 } from './migrate-model-v2'

const debugMigrate = debug('app:migration:entities')

export class MigrateEntities extends MigrateModelV2 {
  constructor (filename, app = {}) {
    super('building_entity', filename, app)
  }

  async pushToDatabase (record) {
    const buildingRepo = new BuildingRepository()

    const building = await buildingRepo.findBuildingByMetadataMigration(record._migrateBuildingId)
    if (building) {
      debugMigrate('Building found, record:', record)
      return buildingRepo.addEntity(building, record)
    } else {
      debugMigrate('Building not found', record._migrateBuildingId)
    }
  }
}
