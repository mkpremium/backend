import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { logger } from '../src/infrastructure/logger'

connectCouchbaseBucket()
    .then(bucketConnection => {
        process.exit(0)
    })
    .catch(error => {
        logger.crit('Starting proposals sender', { message: error.message, stack: error.stack })
        process.exit(1)
    })

