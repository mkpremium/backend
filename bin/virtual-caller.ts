import { initLogger } from '../src/infrastructure/logger'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { createDiContainer } from '../src/infrastructure/dependencies'

const logger = initLogger()
logger.info('Starting virtual caller')

connectCouchbaseBucket()
  .then(bucketConnection => {
    const container = createDiContainer(bucketConnection)
    const service = container.resolve<Function>('virtualCaller')

    service('+12393301250', '+56976675541')
      .catch(error => {
        logger.error('Error calling with virtual caller', {
          error: error.message,
          stack: error.stack
        })
        process.exit(1)
      })
      .then(() => {
        logger.info('Call with virtual caller done')
        process.exit(0)
      })
  })
  .catch(error => {
    logger.error('Error initializing virtual caller', {
      error: error.message,
      stack: error.stack,
    })
    process.exit(1)
  })
