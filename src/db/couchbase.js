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

  // http://bluebirdjs.com/docs/api/deferred-migration.html
  const { promise, resolve, reject } = defer()

  const bucket = cluster.openBucket(couchbase.bucket)
  CouchbaseModel.prototype._promiseBucket = promise

  checkBucket(bucket, cluster, resolve, reject)

  if (app) {
    Object.assign(app.locals, { cluster, bucket, bucketPromise: promise })
  }

  return promise
}

function checkBucket (bucket, cluster, resolve, reject, retries = couchbase.retries) {
  logger.info(`checking bucket ${bucket._name} for connection (${retries})`)

  if (bucket.connected) {
    logger.info(`bucket ${bucket._name} connected`)
    attachHelpers(bucket)
    attachModel(bucket, cluster)
    resolve(bucket)
  } else {
    if (retries <= 0) {
      reject(new Error(`It's possible an error trying to connect bucket ${bucket._name} check your setup`))
    } else {
      setTimeout(() => checkBucket(bucket, cluster, resolve, reject, retries - 1), couchbase.timeout)
    }
  }
}

function attachModel (bucket, cluster) {
  CouchbaseModel.prototype._bucket = bucket
  CouchbaseModel.prototype._bucketName = bucket._name
  CouchbaseModel.prototype._cluster = cluster
}
