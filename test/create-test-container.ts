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
        new Promise(resolve => {
          bucket.manager().flush(() => setTimeout(resolve, 500))
        }),
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
