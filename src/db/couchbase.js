import Couchbase from 'couchbase'
import { couchbase } from '../../config'
import attachHelpers from './helpers'

import '../types'
import '../lib/squel/let'

import { CouchbaseModel } from './model'
import { defer } from '../lib/promise-util'
import { logger } from '../infrastructure/logger'

export default (app) => {
  logger.info(`initializing couchbase connection with "${couchbase.uri}"`)
  const cluster = new Couchbase.Cluster(couchbase.uri)
  cluster.authenticate(couchbase.user, couchbase.pass)

  const { promise, bucket } = connectToBucket(cluster, couchbase.bucket)

  CouchbaseModel.prototype._promiseBucket = promise
  if (app) {
    Object.assign(app.locals, { cluster, bucket, bucketPromise: promise })
  }

  return promise
}

function connectToBucket (cluster, bucketName) {
  // http://bluebirdjs.com/docs/api/deferred-migration.html
  const { promise, resolve, reject } = defer()

  const bucket = cluster.openBucket(bucketName)
  bucket.on('error', error => {
    logger.error('couchbase connection error', { error })
    reject(error)
  })
  bucket.on('connect', (...args) => {
    attachHelpers(bucket)
    attachModel(bucket, cluster)
    resolve(bucket)
  })
  return { promise, bucket }
}

function attachModel (bucket, cluster) {
  CouchbaseModel.prototype._bucket = bucket
  CouchbaseModel.prototype._bucketName = bucket._name
  CouchbaseModel.prototype._cluster = cluster
}
