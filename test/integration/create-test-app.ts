import { createApp } from '../../src/app'
import { setupPostgres } from '../create-test-container'
import type { Express } from 'express'

export const createTestApp = (): Promise<Express> => createApp('postgres')
  .then(async app => {
    await setupPostgres()

    return app
  })
