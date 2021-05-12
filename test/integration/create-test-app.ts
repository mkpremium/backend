import { Bucket } from 'couchbase'
import { createApp } from '../../src/app'

export const createTestApp = () => createApp()
  .then(app => {
    const bucket: Bucket = app.locals.diContainer.resolve('couchbaseBucket')
    return new Promise((resolve) => {
      bucket.manager().flush(() => {
        resolve(app)
      })
    })
  })
