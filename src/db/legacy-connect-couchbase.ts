import { couchbase } from '../../config'
import { logger } from '../infrastructure/logger'
import '../lib/squel/let'

import '../types'
import { connectCouchbaseBucket } from './connect-couchbase-bucket'

export default () => {
  logger.info(`initializing couchbase connection with "${couchbase.uri}"`)

  return connectCouchbaseBucket().then(bucket => {
    logger.info('successfully connected to Couchbase')
    return bucket
  })
}
