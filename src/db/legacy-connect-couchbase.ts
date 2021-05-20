import { couchbase } from '../../config'
import { logger } from '../infrastructure/logger'
import '../lib/squel/let'

import '../types'
import { connectCouchbaseBucket } from './connect-couchbase-bucket'
import { Bucket } from 'couchbase'

export default (): Promise<Bucket & { name: string }> => {
  logger.info(`initializing couchbase connection with "${couchbase.uri}"`)

  return connectCouchbaseBucket().then(bucket => {
    logger.info('successfully connected to Couchbase')
    return bucket as Bucket & { name: string }
  })
}
