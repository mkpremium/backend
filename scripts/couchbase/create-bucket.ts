import retry from 'bluebird-retry'
import { Bucket, Cluster, connect } from 'couchbase'
import _ from 'lodash'
import { exec } from 'child_process'

const ONE_MINUTE = 60000
module.exports = async (bucketName = 'mkpremium_test') => {
  const config = {
    connString: 'couchbase://127.0.0.1?detailed_errcodes=1&operation_timeout=180.0',
    username: 'couchbase',
    password: 'couchbase',
  }

  const cluster = await connect(config.connString, {
    username: config.username,
    password: config.password,
  })

  const clusterManager = cluster.buckets()

  const createBucket = () => clusterManager.createBucket({
    name: bucketName,
    flushEnabled: true,
    ramQuotaMB: 256,
  } as any).catch(error => {
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
    bucketConnection = cluster.bucket(bucketName)
    return Promise.resolve([ bucketConnection, cluster ])
  }

  console.info(`Initializating bucket with name ${bucketName}`)
  const isBucketReadyCommand = 'docker exec  `docker ps --format \'{{.Names}}\'` grep -rq "The following buckets became ready on node" /opt/couchbase/var/lib/couchbase/logs/info.log'

  return retry(createBucket, { max_tries: 3, interval: ONE_MINUTE / 6 })
    .then(() => {
      return retry(() => {
        return new Promise((resolve, reject) => {
          const child = exec(isBucketReadyCommand, (error) => {
            if (error || child.exitCode !== 0) {
              reject(error || child.exitCode)
            } else {
              resolve(undefined)
            }
          })
        })
      }, {
        interval: ONE_MINUTE / 4,
        timeout: 5 * ONE_MINUTE,
      })
    })
    .then(() => {
      let bucket: Bucket
      let cluster: Cluster
      return retry(() => getBucketConnection()
          .then(([ bkt, cls ]) => {
            bucket = bkt
            cluster = cls
            console.log('Trying to create primary index')
            return cluster.queryIndexes().createPrimaryIndex(bucketName, { ignoreIfExists: true })
              .catch(error => {
                console.error('Error on primary index creation attempt', { error })
                throw error
              })
          }),
        {
          interval: ONE_MINUTE / 4,
          timeout: 2 * ONE_MINUTE,
        }
      )
        .catch(error => {
          console.error('Primary index creation failed', { error })
          throw error
        })
        .then(() => {
          console.info('Creating application indexes')
          return cluster.queryIndexes().createIndex(
            bucketName,
            `${bucketName}_document-type`,
            [ '_documentType' ],
            {
              ignoreIfExists: true, deferred: false
            }
          )
        })
    })
}
