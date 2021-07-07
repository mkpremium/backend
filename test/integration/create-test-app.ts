import { createApp } from '../../src/app'
import { Express } from 'express'
import { flushBucket } from '../create-test-container'

export const createTestApp = (): Promise<Express> => createApp()
  .then(async app => {
    await flushBucket(app.locals.diContainer.resolve('couchbaseBucket'))

    return app
  })
