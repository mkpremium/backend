import { moveWorksheetOutOfFreezer } from '../src/business/worksheets/freezer'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { createDiContainer } from '../src/infrastructure/dependencies'
import { initLogger } from '../src/infrastructure/logger'
import '../src/types'

const logger = initLogger()
logger.info('starting freezer')

connectCouchbaseBucket()
  .then(async (couchbaseBucket) => {
    const diContainer = createDiContainer(couchbaseBucket)
    await moveWorksheetOutOfFreezer(500, diContainer.resolve('buildingsRepository'), parseInt(process.env.DAYS_IN_FREEZER) || 90)
    logger.info('freezer finished correctly')
    process.exit(0)
  })
  .catch(error => {
    logger.error('starting freezer', {
      error: {
        message: error.message ? error.message : error.toString(),
        stack: error.stack ? error.stack : undefined
      }
    })
    process.exit(1)
  })
