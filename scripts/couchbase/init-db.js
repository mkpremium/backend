const Promise = require('bluebird')
const couchbase = require('couchbase')

const config = {
  connString: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1&operation_timeout=4',
  username: process.env.COUCHBASE_USER || 'couchbase',
  password: process.env.COUCHBASE_PASS || 'couchbase',
  bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium_test'
}
const BUCKET_MIN_REQUIRED_MB = 100

const bucketName = config.bucketName

const cluster = Promise.promisifyAll(new couchbase.Cluster(config.connString))

cluster.authenticate(config.username, config.password)
const clusterManager = Promise.promisifyAll(cluster.manager())
const createBucket = () => clusterManager.createBucketAsync(bucketName, {
  flushEnabled: 1,
  ramQuotaMB: BUCKET_MIN_REQUIRED_MB
})

const CONNECTION_WAIT_TIME = 60000
const BUCKET_CREATION_WAIT_TIME = 60000
const EXISTING_BUCKET = 'EXISTING_BUCKET'
const NEW_BUCKET = 'NEW_BUCKET'

console.info(`Initializating bucket with name ${bucketName}`)
createBucket()
  .then(() => {
    console.info('Bucket created')
    return Promise.delay(BUCKET_CREATION_WAIT_TIME).then(() => NEW_BUCKET)
  })
  .catch(error => {
    if ([ 'ECONNREFUSED', 'ECONNRESET' ].indexOf(error.code) !== -1) {
      console.info(`Connection error, waiting ${CONNECTION_WAIT_TIME / 1000} seconds before retrying`, { code: error.code })
      return Promise.delay(CONNECTION_WAIT_TIME).then(createBucket).delay(BUCKET_CREATION_WAIT_TIME).then(() => NEW_BUCKET)
    } else if (error.statusCode === 400) {
      console.warn('Guessing error means that bucket already exists', { error })
      return EXISTING_BUCKET
    }
    console.error('Bucket creation failed', { error })
    throw error
  })
  .then((bucketSource) => {
    const bucket = cluster.openBucket(bucketName)
    const bucketManager = Promise.promisifyAll(bucket.manager())

    console.info({ bucketSource })
    if (bucketSource === NEW_BUCKET) {
      console.info('Initializing new bucket')
      console.info('Creating primary index')
      return bucketManager
        .createPrimaryIndexAsync({ name: `${bucketName}_primary`, ignoreIfExists: true })
        .catch(error => {
          console.warn('Primary index creation failed on first attempt, retrying', { error })
          return Promise.delay(10000).then(() => bucketManager.createPrimaryIndexAsync({ name: `${bucketName}_primary`, ignoreIfExists: true }))
        })
        .catch(error => {
          console.error('Primary index creation failed', { error })
          throw error
        })
        .then(() => {
          console.info('Creating application indexes')
          return bucketManager.createIndexAsync(
            `${bucketName}_document-type`,
            [ '_documentType' ],
            {
              ignoreIfExists: true, deferred: false
            }
          )
        })
    } else {
      console.info('Flushing existing bucket')
      return bucketManager.flushAsync()
    }
  })
  .then(() => {
    console.info('Done!')
    return process.exit()
  })
  .catch(error => {
    console.error({ error, stack: error.stack })
    process.exit(1)
  })


