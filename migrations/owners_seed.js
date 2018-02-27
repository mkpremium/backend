import app from '../src/app';

import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';

async function init() {
  await app.locals.bucketPromise;

  const migrateBuildings = new MigrateModel('owner', resolve(__dirname, '../test/fixtures/sample_owners_20.csv'), app);
  await migrateBuildings.run();
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
