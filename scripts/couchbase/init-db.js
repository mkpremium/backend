const Promise = require('bluebird')
const couchbase = require('couchbase')

const config = {
  connString: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1&operation_timeout=4',
  username: process.env.COUCHBASE_USER || 'couchbase',
  password: process.env.COUCHBASE_PASS || 'couchbase',
  bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium_test'
}
const cluster = new couchbase.Cluster(config.connString)
cluster.authenticate(config.username, config.password);

const BUCKET_MIN_REQUIRED_MB = 100
const bucketName = config.bucketName

let bucket
let bucketManager

const clusterManager = Promise.promisifyAll(cluster.manager())
clusterManager.createBucketAsync(bucketName, {flushEnabled: 1, ramQuotaMB: BUCKET_MIN_REQUIRED_MB})
  .then(() => Promise.delay(2000))
  .catch(() => undefined)
  .finally(() => {
    bucket = cluster.openBucket(bucketName)
    bucketManager = Promise.promisifyAll(bucket.manager())
  })
  .then(() => bucketManager.flushAsync())
  .then(() => bucketManager.createPrimaryIndexAsync({name: `${bucketName}_primary`, ignoreIfExists: true}))
  .then(() => {
    return bucketManager.createIndexAsync(
      `${bucketName}document-type`,
      ['_documentType'],
      {
        ignoreIfExists: true, deferred: false
      }
    )
  })
  .then(() => process.exit())
  .catch(error => {
    console.error({error, stack: error.stack})
    process.exit(1);
  })


