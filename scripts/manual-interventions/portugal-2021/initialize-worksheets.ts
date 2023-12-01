import '../../../src/infrastructure/o11y/honeycomb'
import { initLogger } from '../../../src/infrastructure/logger'
import { CouchbaseAdapter } from '../../../src/db/couchbase.adapter'
import { createDiContainer } from '../../../src/infrastructure/dependencies'
import { startListeners } from '../../../src/infrastructure/listeners'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {
  Portugal2021WorksheetInitializerService
} from '../../../src/building/service/portugal2021-worksheet-initializer.service'

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
  const diContainer = await createDiContainer()

  startListeners(diContainer)

  return loop(diContainer.resolve('couchbaseAdapter'), diContainer.resolve('portugal2021WorksheetInitializerService'))
}

async function loop (couchbaseAdapter: CouchbaseAdapter, initializer: Portugal2021WorksheetInitializerService) {
  const buildingIds = await couchbaseAdapter.queryAsync(importedBuildingsIds, [ 100 ])
  if (buildingIds.length === 0) {
    logger.info('No more buildings to import.')
    return
  }

  for (const { id } of buildingIds) {
    await pipe(
      initializer.createWorksheetFor({ sourceBuildingId: id }),
      TE.match(
        error => {
          logger.error('Could not create worksheet for building', { id, error: error.message, stack: error.stack })
        },
        () => {
          logger.info('Worksheet created for building', { id })
        }
      ),
    )()
  }

  await new Promise(resolve => setTimeout(resolve, 1000))
  return loop(couchbaseAdapter, initializer)
}

const importedBuildingsIds = `
    SELECT id
    FROM mkpremium building
    WHERE _documentType = "portugal-2021-building"
      AND status = 'OWNERS_IMPORTED'
    ORDER BY statusChangedAt ASC
        LIMIT $1
`
