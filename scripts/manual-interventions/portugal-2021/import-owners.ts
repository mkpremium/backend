import '../../../src/infrastructure/o11y/honeycomb'
import { connectCouchbaseBucket } from '../../../src/db/connect-couchbase-bucket'
import { initLogger } from '../../../src/infrastructure/logger'
import { CouchbaseAdapter } from '../../../src/db/couchbase.adapter'
import { createDiContainer } from '../../../src/infrastructure/dependencies'
import { startListeners } from '../../../src/infrastructure/listeners'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { Portugal2021OwnersImporterService } from '../../../src/building/service/portugal2021-owners-importer.service'

const logger = initLogger()

exec()
  .then(() => {
    process.exit()
  })
  .catch(error => {
    logger.error('Oops', { error: error.message, stack: error.stack })
    process.exit(1)
  })

async function exec () {
  const couchbaseBucket = await connectCouchbaseBucket()
  const diContainer = createDiContainer(couchbaseBucket)

  startListeners(diContainer)

  return loop(diContainer.resolve('couchbaseAdapter'), diContainer.resolve('portugal2021OwnersImporterService'))
}

async function loop (couchbaseAdapter: CouchbaseAdapter, importer: Portugal2021OwnersImporterService) {
  const buildingIds = await couchbaseAdapter.queryAsync(importedBuildingsIds, [ 10 ])
  if (buildingIds.length === 0) {
    logger.info('No more buildings to import.')
    return
  }

  for (const { id } of buildingIds) {
    await pipe(
      importer.importOwnersOf({ sourceBuildingId: id }),
      TE.match(
        error => {
          logger.error('Building owners not imported', { id, error: error.message, stack: error.stack })
        },
        () => {
          logger.info('Building owners imported', { id })
        }
      ),
    )()
  }

  await new Promise(resolve => setTimeout(resolve, 1000))
  return loop(couchbaseAdapter, importer)
}

const importedBuildingsIds = `
    SELECT id
    FROM mkpremium building
    WHERE _documentType = "portugal-2021-building"
      AND status = 'BUILDING_IMPORTED'
    ORDER BY statusChangedAt ASC
        LIMIT $1
`


