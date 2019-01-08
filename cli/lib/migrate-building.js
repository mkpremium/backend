import {MigrateModelV3} from '../../src/migration/lib/migrate-model-v3';
import building from '../../src/migration/models/building';

export class MigrateBuilding extends MigrateModelV3 {
  async parseToData(data, row) {
    return building(data);
  }
}

export async function migrateBuilding(inputFile, bucket) {
  const migrate = new MigrateBuilding(inputFile, bucket);
  return migrate.run();
}
