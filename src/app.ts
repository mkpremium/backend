import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Express } from 'express'
import morgan from 'morgan'
import autocomplete from './autocomplete'
import { buildingEventListeners } from './building/listeners'
import { buildingRoutes } from './building/routing'
import cadastre from './cadastre'
import { setupCallerRoutes } from './caller/init'

import './db/legacy-connect-couchbase'
import email from './email'
import { initFlipperModule } from './flipper/init'
import history from './history'
import { createDiContainer } from './infrastructure/dependencies'
import appErrorHandler from './infrastructure/error-handler'
import { initLogger } from './infrastructure/logger'
import metadata from './metadata'
import notes from './notes'
// modules
import operator from './operator'
import { setupOwnersRoutes } from './owner'
import { init as initPropertyManager } from './property-manager'
import { setupScheduledEventsRoutes } from './scheduled-events'

import stats from './stats'
import { setupStockRouter } from './stock/stock-router'
import preferences from './system-preferences'
import maintenanceMode from './system-preferences/maintenance-mode-middleware'
import { createTestHarness } from './test-harness/routes'
// app aware types
import './types'
import { setupUserRoutes } from './user'
import { worksheetEventListeners } from './worksheet/listeners'
import { worksheetsRoutes } from './worksheet/routing'
import { connectCouchbaseBucket } from './db/connect-couchbase-bucket'
import { EventBus } from './infrastructure/event-bus'
import { callsRoutes } from './calls/routing'
import { callsEventListeners } from './calls/listeners'

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
      buildingEventListeners(diContainer)
      callsEventListeners(diContainer)
      worksheetEventListeners(diContainer)
      buildingRoutes(diContainer, app)
      setupOwnersRoutes(app, diContainer)

      setupScheduledEventsRoutes(app, diContainer)
      worksheetsRoutes(app, diContainer)
      createTestHarness(app, diContainer)
      initPropertyManager(app, diContainer)
      initFlipperModule(app, diContainer)
      setupCallerRoutes(app, diContainer)
      setupStockRouter(app, diContainer)

      stats(app, diContainer)
      maintenanceMode(app)
      history(app)
      notes(app)
      metadata(app)
      autocomplete(app)
      email(app)
      cadastre(app)
      preferences(app)

      app.use(appErrorHandler)
      app.set('IS_READY', true)
      const eventBus: EventBus = diContainer.resolve('eventBus')
      logger.info('App is ready', {
        eventSubscribersInfo: eventBus.info
      })

      return app
    })
    .catch(error => {
      logger.error('error starting application', { error: error.message, stack: error.stack })
      process.exit(1)
    })
}
