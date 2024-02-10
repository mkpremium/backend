import { createApp } from '../../src/app'
import { Express } from 'express'
import { setupPostgres } from '../create-test-container'

export const createTestApp = (database: 'postgres' = 'postgres'): Promise<Express> => createApp(database)
  .then(async app => {
    await setupPostgres()

    return app
  })
