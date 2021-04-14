import { createApp } from '../../src/app'

export const createTestApp = () => createApp()
  .then(async (app) => {
    await app.locals.diContainer.resolve('couchbaseBucket').flushAsync()

    return app
  })
