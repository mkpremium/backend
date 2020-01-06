import app from '../src/app'

import {resolve} from 'path'
import {MigrateModelV2} from '../src/migration/lib/migrate-model-v2'

async function init () {
  await app.locals.bucketPromise

  const migrateNeighborhoods = new MigrateModelV2('neighborhood', resolve(__dirname, '../csv/Barrios.csv'), app, {delimiter: ','})
  await migrateNeighborhoods.run()
  const migrateCity = new MigrateModelV2('city', resolve(__dirname, '../csv/Ciudad.csv'), app, {delimiter: ','})
  await migrateCity.run()
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
