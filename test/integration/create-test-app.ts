import { Bucket, N1qlQuery } from 'couchbase'
import { createApp } from '../../src/app'
import { Express } from 'express'

export const createTestApp = (): Promise<Express> => createApp()
  .then(app => {
    const bucket: Bucket & { name: string } = app.locals.diContainer.resolve('couchbaseBucket')
    return new Promise((resolve, reject) => {
      bucket.query(N1qlQuery.fromString(`DELETE * FROM${bucket.name}`), error => {
        if (error) {
          reject(error)
        } else {
          resolve(app)
        }
      })
    })
  })
