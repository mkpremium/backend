import debug from 'debug';
import {BuildingRepository} from '../../src/building/models';
import {MigrateModelV3} from '../../src/migration/lib/migrate-model-v3';
import entity from '../../src/migration/models/building_entity';

const debugMigrate = debug('app:migration:entities');

export async function migrateBuildingEntities(inputFile) {
  const buildingEntities = new MigrateEntities(inputFile);
  await buildingEntities.run();
}

export class MigrateEntities extends MigrateModelV3 {

  async parseToData(data, row) {
    return entity(data);
  }

  async pushToDatabase(record) {
    const buildingRepo = new BuildingRepository();

    const building = await buildingRepo.findBuildingByMetadataMigration(record._migrateBuildingId);
    if (building) {
      debugMigrate('Building found, record:', record);
      return buildingRepo.addEntity(building, record);
    } else {
      debugMigrate('Building not found', record._migrateBuildingId);
    }
  }
}
