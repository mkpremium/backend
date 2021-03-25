const Promise = require('bluebird')
const retry = require('bluebird-retry')
const couchbase = require('couchbase')
const uuid = require('uuid/v4')

const config = {
  connString: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1&operation_timeout=120',
  username: process.env.COUCHBASE_USER || 'couchbase',
  password: process.env.COUCHBASE_PASS || 'couchbase',
  bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium_test'
}
const bucketName = config.bucketName

const cluster = Promise.promisifyAll(new couchbase.Cluster(config.connString))

cluster.authenticate(config.username, config.password)

const clusterManager = Promise.promisifyAll(cluster.manager())
const CLUSTER_MAX_MEMORY_MB = 512
const createBucket = () => clusterManager.createBucketAsync(bucketName, {
  flushEnabled: 1,
  ramQuotaMB: 100
})

const ONE_MINUTE = 60000
const CONNECTION_WAIT_TIME = ONE_MINUTE * 2
const RETRY_WAIT_TIME = ONE_MINUTE * 2
const EXISTING_BUCKET = 'EXISTING_BUCKET'
const NEW_BUCKET = 'NEW_BUCKET'

console.info(`Initializating bucket with name ${bucketName}`)
createBucket()
  .then(() => {
    console.info('Bucket created')
    return Promise.delay(RETRY_WAIT_TIME).then(() => NEW_BUCKET)
  })
  .catch(error => {
    if ([ 'ECONNREFUSED', 'ECONNRESET' ].indexOf(error.code) !== -1) {
      console.info(`Connection error, waiting ${CONNECTION_WAIT_TIME / 1000} seconds before retrying`, { code: error.code })
      return Promise.delay(CONNECTION_WAIT_TIME).then(createBucket).delay(RETRY_WAIT_TIME).then(() => NEW_BUCKET)
    } else if (error.statusCode === 400) {
      console.warn('Guessing error means that bucket already exists', { error })
      return EXISTING_BUCKET
    }
    console.error('Bucket creation failed', { error })
    throw error
  })
  .then((bucketSource) => {
    console.info({ bucketSource })
    console.info('Creating primary index')

    const bucket = cluster.openBucket(bucketName)
    const bucketManager = Promise.promisifyAll(bucket.manager())
    return retry(() => {
        console.log('Trying to create primary index')
        const id = uuid()
        console.time(`primaryIndexCreationAttempt-${id}`)
        return bucketManager.createPrimaryIndexAsync({ name: `${bucketName}_primary`, ignoreIfExists: true })
          .then(() => {
            console.timeEnd(`primaryIndexCreationAttempt-${id}`)
          })
          .catch(error => {
            console.timeEnd(`primaryIndexCreationAttempt-${id}`)
            console.error('Error on primary index creation attempt', { errorMessage: error.message })
            throw error
          })
      },
      {
        backoff: 2,
        interval: ONE_MINUTE,
        max_interval: ONE_MINUTE * 5,
        max_tries: 10,
        timeout: ONE_MINUTE * 10
      })
      .catch(error => {
        console.error('Primary index creation failed', { errorMessage: error.message })
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


