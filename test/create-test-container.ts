import { createDiContainer } from '../src/infrastructure/dependencies'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { AwilixContainer } from 'awilix'
import { Bucket, N1qlQuery } from 'couchbase'

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
        new Promise((resolve, reject) => {
          console.time('deleteDocs')
          bucket.query(N1qlQuery.fromString('DELETE FROM mkpremium_test'), (error) => {
            console.timeEnd('deleteDocs')
            if (error) {
              console.error('Error deleting documents', error)
              reject(error)
              return
            }
            return setTimeout(resolve, 1000)
          })
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
