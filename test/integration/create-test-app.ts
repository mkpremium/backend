import { Bucket } from 'couchbase'
import { createApp } from '../../src/app'
import { Express } from 'express'

export const createTestApp = (): Promise<Express> => createApp()
  .then(app => {
    const bucket: Bucket = app.locals.diContainer.resolve('couchbaseBucket')
    return new Promise((resolve) => {
      bucket.manager().flush(() => {
        resolve(app)
      })
    })
  })
