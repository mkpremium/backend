import { createApp } from '../../src/app'
import { Express } from 'express'
import { flushBucket, setupPostgres } from '../create-test-container'

export const createTestApp = (database: 'couchbase' | 'postgres' = 'couchbase'): Promise<Express> => createApp(database)
  .then(async app => {
    if (database === 'couchbase') {
      await flushBucket(app.locals.diContainer.resolve('couchbaseBucket'))
    }
    await setupPostgres()

    return app
  })
