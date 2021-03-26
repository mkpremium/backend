const Promise = require('bluebird')
const retry = require('bluebird-retry')
const couchbase = require('couchbase')
const uuid = require('uuid/v4')

const config = {
  connString: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1&operation_timeout=180.0',
  username: process.env.COUCHBASE_USER || 'couchbase',
  password: process.env.COUCHBASE_PASS || 'couchbase',
  bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium_test'
}
const bucketName = config.bucketName

const cluster = Promise.promisifyAll(new couchbase.Cluster(config.connString))
cluster.authenticate(config.username, config.password)

const clusterManager = Promise.promisifyAll(cluster.manager())
const createBucket = () => clusterManager.createBucketAsync(bucketName, {
  flushEnabled: 1,
  ramQuotaMB: 100
}).catch(error => {
  if (error.statusCode === 400) {
    console.warn('Guessing error means that bucket already exists', { error })
    return EXISTING_BUCKET
  }
  throw error
})

const ONE_MINUTE = 60000
const EXISTING_BUCKET = 'EXISTING_BUCKET'
const NEW_BUCKET = 'NEW_BUCKET'

let bucketConnection
const getBucketConnection = () => {
  if (bucketConnection) {
    if (bucketConnection.connected) {
      return bucketConnection
    } else {
      bucketConnection.disconnect()
    }
  }

  cluster.authenticate(config.username, config.password)
  bucketConnection = cluster.openBucket(bucketName, (...args) => {
    console.log('open bucket result', { args })
  })
  return bucketConnection
}

console.info(`Initializating bucket with name ${bucketName}`)
retry(createBucket, { max_tries: 3, interval: ONE_MINUTE / 6 })
  .then(() => {
    console.info('Bucket created')
    return NEW_BUCKET
  })
  .then((bucketSource) => {
    console.info({ bucketSource })
    console.info('Creating primary index')

    let bucket, bucketManager

    return retry(() => {
        bucket = getBucketConnection()
        bucketManager = Promise.promisifyAll(bucket.manager())
        if (!bucket.connected) {
          bucket.connected = true
        }
        console.log('Trying to create primary index')
        return bucketManager.createPrimaryIndexAsync({ name: `${bucketName}_primary`, ignoreIfExists: true })
          .then(() => {
          })
          .catch(error => {
            console.error('Error on primary index creation attempt', { error })
            throw error
          })
      },
      {
        interval: ONE_MINUTE / 4,
        backoff: 2,
        max_interval: ONE_MINUTE,
        max_tries: 10,
        timeout: 5 * ONE_MINUTE,
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
  })
  .then(() => {
    console.info('Done!')
    return process.exit()
  })
  .catch(error => {
    console.error({ error, stack: error.stack })
    process.exit(1)
  })


