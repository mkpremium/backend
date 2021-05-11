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
    () => Cluster.connect(config.uri, {
      username: config.username,
      password: config.password
    }).then(cluster => cluster.bucket(config.bucketName))
      .then(bucket => {
        CouchbaseModel.setCouchbaseBucket(bucket)
        return bucket
      }),
    {
      maxTries: 3,
      interval: 100,
    }
  )
}
