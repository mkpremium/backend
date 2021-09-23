import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Express } from 'express'
import morgan from 'morgan'
import autocomplete from './autocomplete'
import { buildingEventListeners } from './building/listeners'
import { buildingRoutes } from './building/routing'
import cadastre from './cadastre'
import { setupCallerRoutes } from './caller/init'

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
import { init as initPropertyManager } from './property-manager'

import stats from './stats'
import { setupStockRouter } from './stock/stock-router'
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
import { setupOwnersRoutes } from './owner/routing'
import { ownerEventListeners } from './owner/listeners'
import { scheduledEventsRoutes } from './scheduled-events/routing'
import { scheduledEventsEventListeners } from './scheduled-events/event-listeners'

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
      ownerEventListeners(diContainer)
      callsEventListeners(diContainer)
      scheduledEventsEventListeners(diContainer)
      worksheetEventListeners(diContainer)

      buildingRoutes(diContainer, app)
      setupOwnersRoutes(app, diContainer)
      scheduledEventsRoutes(diContainer, app)

      worksheetsRoutes(app, diContainer)
      createTestHarness(app, diContainer)
      initPropertyManager(app, diContainer)
      initFlipperModule(app, diContainer)
      setupCallerRoutes(app, diContainer)
      setupStockRouter(app, diContainer)

      stats(app, diContainer)
      history(app)
      notes(app)
      metadata(app)
      autocomplete(app)
      email(app)
      cadastre(app)

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
