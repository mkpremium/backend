import {BuildingRepository} from '../../src/building/models';
import {MigrateModelV2} from '../../src/migration/lib/migrate-model-v2';
import {resolve} from 'path';
import app from '../../src/app';

async function runBuildingSeedAndGetThemAll() {
  const migrateBuildings = new MigrateModelV2('building', resolve(__dirname, '../fixtures/sample_buildings_20.csv'), app);
  await migrateBuildings.run();
  const buildingRepository = new BuildingRepository();
  return buildingRepository.query();
}

module.exports = {
  runBuildingSeedAndGetThemAll
};
