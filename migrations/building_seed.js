import app from '../src/app';

import {resolve} from 'path';
import {MigrateModelV2} from '../src/migration/lib/migrate-model-v2';

async function init() {
  await app.locals.bucketPromise;

  const migrateBuildings = new MigrateModelV2('building', resolve(__dirname, '../test/fixtures/sample_buildings_20.csv'), app);
  await migrateBuildings.run();
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
