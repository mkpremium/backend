import app from '../src/app';

import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';

async function init() {
  await app.locals.bucketPromise;

  const migrateNeighborhoods = new MigrateModel('neighborhood', resolve(__dirname, '../csv/Barrios.csv'), app, {delimiter: ','});
  await migrateNeighborhoods.run();
  const migrateCity = new MigrateModel('city', resolve(__dirname, '../csv/Ciudad.csv'), app, {delimiter: ','});
  await migrateCity.run();
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
