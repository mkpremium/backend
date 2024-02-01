import { setupContainer } from '../src/infrastructure/dependencies'
import type { Bucket } from 'couchbase'
import { createContainer } from 'awilix'
import { AppDataSource } from '../src/data-source'

let cachedBucket: Bucket

async function setupCouchbaseBucket () {
  const { connectCouchbaseBucket } = await import('../src/db/connect-couchbase-bucket')
  const bucket = await (cachedBucket ? Promise.resolve(cachedBucket) : connectCouchbaseBucket())

  await flushBucket(bucket)
  return bucket
}

export async function setupPostgres () {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
  await AppDataSource.synchronize(true)

  return AppDataSource
}

export async function createTestContainer ({ couchbase, postgres }: {
  couchbase: boolean,
  postgres: boolean
} = { couchbase: true, postgres: false }) {
  const [bucket, dataSource] = await Promise.all([
    couchbase ? setupCouchbaseBucket() : Promise.resolve(null),
    postgres
      ? setupPostgres()
      : Promise.resolve({
        getRepository: () => null
      } as any)
  ])
  const container = createContainer()
  await setupContainer(container, bucket, dataSource, postgres)

  return container
}

export async function flushBucket (bucket: Bucket) {
  const { N1qlQuery } = await import('couchbase')
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
