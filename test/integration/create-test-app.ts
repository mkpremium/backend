import { Bucket } from 'couchbase';
import { createApp } from '../../src/app'

export const createTestApp = () => createApp()
  .then(async (app) => {
    const bucket: Bucket = app.locals.diContainer.resolve('couchbaseBucket')
    await bucket.cluster.buckets().flushBucket(bucket.name)

    return app
  })
