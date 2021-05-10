import { couchbase } from '../../config'
import { logger } from '../infrastructure/logger'
import '../lib/squel/let'

import '../types'
import { connectCouchbaseBucket } from './connect-couchbase-bucket'
import attachHelpers from './helpers'

import { CouchbaseModel } from './model'

export default () => {
    logger.info(`initializing couchbase connection with "${couchbase.uri}"`)

    return connectCouchbaseBucket().then(bucket => {
        // attachHelpers(bucket)
        // @ts-ignore
        CouchbaseModel.setCouchbaseBucket(bucket)
        logger.info('successfully connected to Couchbase')
        return bucket
    })
}
