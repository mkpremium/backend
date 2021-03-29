const Promise = require('bluebird')
const retry = require('bluebird-retry')
const couchbase = require('couchbase')
const _ = require('lodash')

const ONE_MINUTE = 60000
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
  if (error.statusCode === 400 && _.get(error, 'response.errors.name') === 'Bucket with given name already exists') {
    console.warn('Guessing error means that bucket already exists', {
      error,
      responseErrors: _.get(error, 'response.errors')
    })
    return 'EXISTING_BUCKET'
  }
  throw error
}).then(existingBucket => (existingBucket ? existingBucket : 'NEW_BUCKET'))

let bucketConnection
const getBucketConnection = () => {
  if (bucketConnection) {
    if (bucketConnection.connected) {
      return Promise.resolve(bucketConnection)
    } else {
      bucketConnection.disconnect()
    }
  }

  return new Promise((resolve, reject) => {
    bucketConnection = cluster.openBucket(bucketName, (error) => {
      if (error) {
        console.error('Error opening bucket', {
          error,
          bucket: JSON.stringify(bucketConnection),
          cluster: JSON.stringify(cluster),
          clusterManager: JSON.stringify(clusterManager),
        })
        reject(error)
      } else {
        resolve(bucketConnection)
      }
    })
  })
}

console.info(`Initializating bucket with name ${bucketName}`)
retry(createBucket, { max_tries: 3, interval: ONE_MINUTE / 6 })
  .then((bucketSource) => {
    console.info('Creating primary index', { bucketSource })

    let bucket, bucketManager
    return retry(() => getBucketConnection()
        .then(conn => {
          bucket = conn
          bucketManager = Promise.promisifyAll(bucket.manager())
          console.log('Trying to create primary index')
          return bucketManager.createPrimaryIndexAsync({ name: `${bucketName}_primary`, ignoreIfExists: true })
            .catch(error => {
              console.error('Error on primary index creation attempt', { error })
              throw error
            })
        }),
      {
        interval: ONE_MINUTE / 4,
        timeout: 2 * ONE_MINUTE,
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


