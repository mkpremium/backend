import { createDiContainer, setupContainer } from '../src/infrastructure/dependencies'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { Bucket, N1qlQuery } from 'couchbase'
import { createContainer } from 'awilix'

let cachedBucket: Bucket

export async function createTestContainer() {
  const bucketPromise: Promise<Bucket> = new Promise(async resolve => {
    if (!cachedBucket) {
      cachedBucket = await connectCouchbaseBucket()
    }
    resolve(cachedBucket)
  })

  const bucket = await bucketPromise
  await flushBucket(bucket)
  const container = createContainer()
  setupContainer(container, bucket, null)

  return container
}

export function flushBucket (bucket: Bucket) {
  return new Promise((resolve, reject) => {
    console.time('deleteDocs')
    bucket.query(N1qlQuery.fromString('DELETE FROM mkpremium_test'), (error) => {
      console.timeEnd('deleteDocs')
      if (error) {
        console.error('Error deleting documents', error)
        reject(error)
        return
      }
      setTimeout(resolve, 1000)
    })
  })
}
