import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Express } from 'express'
import morgan from 'morgan'
import { buildingRoutes } from './building/routing'
import { setupCallerRoutes } from './caller/init'

import email from './email'
import { createDiContainer } from './infrastructure/dependencies'
import appErrorHandler from './infrastructure/error-handler'
import { initLogger } from './infrastructure/logger'
import metadata from './metadata'
import notes from './notes'
// modules
import operator from './operator'
import { init as initPropertyManager } from './property-manager'
import { setupStockRouter } from './stock/stock-router'
import { createTestHarness } from './test-harness/routes'
// app aware types
import './types'
import { worksheetsRoutes } from './worksheet/routing'
import { connectCouchbaseBucket } from './db/connect-couchbase-bucket'
import { EventBus, EventsDiagnostics } from './infrastructure/event-bus'
import { callsRoutes } from './calls/routing'
import { setupOwnersRoutes } from './owner/routing'
import { scheduledEventsRoutes } from './scheduled-events/routing'
import { flipperRoutes } from './flipper/routing'
import { setupUserRoutes } from './user/routing'
import { statRoutes } from './stats/routing'
import { historyRoutes } from './history/routing'
import { startListeners } from './infrastructure/listeners'

let app: Express
export const createApp = (): Promise<Express> => {
  const logger = initLogger()
  logger.info('starting app')

  if (app) {
    return Promise.resolve(app)
  }
  app = express()

  app.set('IS_READY', false)
  app.get('/_ready', (req, res) => {
    if (app.get('IS_READY')) {
      res.sendStatus(200)
    } else {
      res.sendStatus(503)
    }
  })

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(morgan('combined'))
  app.use(cors())

  return connectCouchbaseBucket()
    .then(couchbaseBucket => {
      const diContainer = createDiContainer(couchbaseBucket)
      app.locals.diContainer = diContainer

      operator(app) // start with login router
      callsRoutes(diContainer, app)
      setupUserRoutes(app, diContainer)
      buildingRoutes(diContainer, app)
      setupOwnersRoutes(app, diContainer)
      scheduledEventsRoutes(diContainer, app)
      worksheetsRoutes(app, diContainer)
      createTestHarness(app, diContainer)
      initPropertyManager(app, diContainer)
      setupCallerRoutes(app, diContainer)
      flipperRoutes(app, diContainer)
      setupStockRouter(app, diContainer)
      statRoutes(app)
      historyRoutes(app)

      notes(app)
      metadata(app)
      email(app)

      startListeners(diContainer)

      app.use(appErrorHandler)
      app.set('IS_READY', true)
      const eventBus: EventsDiagnostics = diContainer.resolve('eventBus')
      logger.info('App is ready', {
        eventSubscribersInfo: eventBus.info
      })

      return app
    })
    .catch(error => {
      logger.error('error starting application', { error: error, stack: error.stack, errorMessage: error.messge })
      process.exit(1)
    })
}
