import '../../src/infrastructure/o11y/honeycomb'
import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import { initLogger } from '../../src/infrastructure/logger'
import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'
import { createDiContainer } from '../../src/infrastructure/dependencies'
import { startListeners } from '../../src/infrastructure/listeners'
import { Portugal2021BuildingsImporterService } from '../../src/building/service/portugal2021-buildings-importer.service'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

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

  return loop(diContainer)
}

async function loop (diContainer) {
  const couchbaseAdapter: CouchbaseAdapter = diContainer.resolve('couchbaseAdapter')
  const importer: Portugal2021BuildingsImporterService = diContainer.resolve('portugal2021BuildingsImporterService')

  const nextSlugsBatch = await couchbaseAdapter.queryAsync(pendingBuildingSlugs, [ 100 ])
  if (nextSlugsBatch.length === 0) {
    logger.info('No more buildings to import.')
    return
  }

  for (const { slug } of nextSlugsBatch) {
    await pipe(
      importer.importSlug({ slug }),
      TE.match(
        error => {
          logger.error('Building not imported', { slug, error: error.message, stack: error.stack })
        },
        () => {
          logger.info('Building imported', { slug })
        }
      ),
    )()
  }
}

const pendingBuildingSlugs = `
    SELECT slug
    FROM mkpremium building
    WHERE _documentType = "portugal-2021-building"
      AND status = 'INBOX'
    ORDER BY statusChangedAt ASC
        LIMIT $1
`


