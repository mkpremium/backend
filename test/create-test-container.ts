import { createDiContainer } from '../src/infrastructure/dependencies'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { AwilixContainer } from 'awilix'
import { Bucket } from 'couchbase'

let cachedContainer: AwilixContainer
let cachedBucket: Bucket

export const createTestContainer = () => {

  const bucketPromise = new Promise(async resolve => {
    if (!cachedBucket) {
      cachedBucket = await connectCouchbaseBucket()
    }
    resolve(cachedBucket)
  })

  return bucketPromise
    .then((bucket: Bucket) => Promise.all([
        flushBucket(bucket),
        new Promise(async resolve => {
          if (!cachedContainer) {
            cachedContainer = await createDiContainer(bucket)
          }
          resolve(cachedContainer)
        })
      ])
    )
    .then(([ _, container ]) => container as AwilixContainer)
}

export function flushBucket (bucket: Bucket) {
  console.time('deleteDocs')
  return bucket.cluster.query('DELETE FROM mkpremium_test')
    .then(() => {
      console.timeEnd('deleteDocs')
      return new Promise(resolve => setTimeout(resolve, 1000))
    })
    .catch((error) => {
      console.error('Error deleting documents', error)
      throw error
    })
}
