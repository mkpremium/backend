import Promise from 'bluebird';

import {MigrateModel} from './migrate-model';
import {BuildingRepository} from '../../building/models';

export class MigrateEntities extends MigrateModel {
  constructor(filename, app = {}) {
    super('building_entity', filename, app);
  }

  async pushToDatabaseRecord(record) {
    const buildingRepo = new BuildingRepository();

    const building = await buildingRepo.findBuildingByMetadataMigration(record._migrateBuildingId);
    if (building) {
      return buildingRepo.addEntity(building, record);
    }
  }

  async pushToDatabase(processedData) {
    return Promise.mapSeries(processedData, this.pushToDatabaseRecord);
  }
}
