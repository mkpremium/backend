import { initLogger } from '../src/infrastructure/logger'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { createDiContainer } from '../src/infrastructure/dependencies'
import { VirtualCallerPhone } from '../src/calls/service/virtual-caller-phone'

const logger = initLogger()
logger.info('Starting virtual caller')

connectCouchbaseBucket()
  .then(bucketConnection => {
    const container = createDiContainer(bucketConnection)
    const service = container.resolve<VirtualCallerPhone>('virtualCaller')

    service.call({
      city: 'BARCELONA',
      number: '2',
      street: 'Eduard Blasco i Ejarque'
    }, {
      status: 'UNDEFINED',
      id: 'test-contact-id',
      type: 'TELEFONO',
      ownerId: 'test-owner-id',
      value: '+56976675541',
    }, 'test-worksheet-id')
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
