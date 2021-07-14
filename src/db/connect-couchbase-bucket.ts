import { Bucket, Cluster } from 'couchbase'
import { CouchbaseModel } from './model'
import retry from 'bluebird-retry'
import { CouchbaseAdapter } from './couchbase.adapter'

const config = {
  uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1',
  bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium',
  username: process.env.COUCHBASE_USER || 'couchbase',
  password: process.env.COUCHBASE_PASS || 'couchbase',
}

export function connectCouchbaseBucket () {
  return retry<Bucket>(
    () => {
      const cluster = new Cluster(config.uri, {
        username: config.username,
        password: config.password,
      })

      const bucket = cluster.bucket(config.bucketName)
      CouchbaseModel.setCouchbaseBucket(bucket, new CouchbaseAdapter(bucket))
      return bucket
    },
    {
      max_tries: 3,
      interval: 100,
    }
  )
}
