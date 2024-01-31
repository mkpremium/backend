import { Bucket, Cluster } from 'couchbase'
import { CouchbaseModel } from './model'
import retry from 'bluebird-retry'
import { CouchbaseAdapter } from './couchbase.adapter'
// legacy types and SQL lybrary.
import '../lib/squel/let'
import '../types'

const config = {
  uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1',
  bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium',
  username: process.env.COUCHBASE_USER || 'couchbase',
  password: process.env.COUCHBASE_PASS || 'couchbase'
}

export function connectCouchbaseBucket () {
  return retry < Bucket >(
    () => {
      const cluster = new Cluster(config.uri)
      cluster.authenticate(config.username, config.password)

      return new Promise((resolve, reject) => {
        const bucket = cluster.openBucket(config.bucketName)
        bucket.on('connect', () => {
          CouchbaseModel.setCouchbaseBucket(bucket, new CouchbaseAdapter(bucket))
          resolve(bucket)
        })
        bucket.on('error', error => reject(error))
      })
    },
    {
      max_tries: 3,
      interval: 100
    }
  )
}
