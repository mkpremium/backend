import {MigrateEntities} from '../../src/migration/lib/migrate-entities';
import couchbase from '../../src/db/couchbase';

export async function migrateBuildingEntities(inputFile) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };
  const buildingEntities = new MigrateEntities(inputFile, app);
  await buildingEntities.run();
}
