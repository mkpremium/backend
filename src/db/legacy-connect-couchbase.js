import Couchbase from 'couchbase'
import { couchbase } from '../../config'
import { logger } from '../infrastructure/logger'
import '../lib/squel/let'

import '../types'
import { connectCouchbaseBucket } from './connect-couchbase-bucket'
import attachHelpers from './helpers'

import { CouchbaseModel } from './model'

export default () => {
  logger.info(`initializing couchbase connection with "${couchbase.uri}"`)
  const cluster = new Couchbase.Cluster(couchbase.uri)
  cluster.authenticate(couchbase.user, couchbase.pass)

  return connectCouchbaseBucket().then(bucket => {
    attachHelpers(bucket)
    CouchbaseModel.prototype._bucket = bucket
    logger.info('successfully connected to Couchbase')
    return bucket
  })
}
