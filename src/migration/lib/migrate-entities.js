import {BuildingRepository} from '../../building/models';
import {MigrateModelV2} from './migrate-model-v2';

export class MigrateEntities extends MigrateModelV2 {
  constructor(filename, app = {}) {
    super('building_entity', filename, app);
  }

  async pushToDatabase(record) {
    const buildingRepo = new BuildingRepository();

    const building = await buildingRepo.findBuildingByMetadataMigration(record._migrateBuildingId);
    if (building) {
      return buildingRepo.addEntity(building, record);
    }
  }
}
