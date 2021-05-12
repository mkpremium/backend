import { Cluster } from 'couchbase'
import { CouchbaseModel } from './model'
import retry from 'bluebird-retry'

const config = {
  uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1',
  bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium',
  username: process.env.COUCHBASE_USER || 'couchbase',
  password: process.env.COUCHBASE_PASS || 'couchbase',
}

export function connectCouchbaseBucket() {
  return retry(
    () => {
      const cluster = new Cluster(config.uri)
      cluster.authenticate(config.username, config.password)

      return new Promise((resolve, reject) => {
        const bucket = cluster.openBucket(config.bucketName)
        bucket.on('connect', () => {
          CouchbaseModel.setCouchbaseBucket(bucket)
          resolve(bucket)
        })
        bucket.on('error', error => reject(error))
      })
    },
    {
      maxTries: 3,
      interval: 100,
    }
  )
}
