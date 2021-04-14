import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import cors from 'cors'

import couchbase from './db/couchbase'
import { logger } from './infrastructure/logger'
// app aware types
import './types'
import { createDiContainer } from './infrastructure/dependencies'
// modules
import operator from './operator'
import { createTestHarness } from './test-harness/routes'
import { setupWorksheetRoutesAndEventListeners } from './worksheet'
import { setupOwnersRoutes } from './owner'
import calls from './calls'
import { setupScheduledEventsRoutes } from './scheduled-events'
import webhooks from './webhooks'
import history from './history'
import notes from './notes'
import { setupBuildingRoutesAndListeners } from './building'
import metadata from './metadata'
import { init as initPropertyManager } from './property-manager'

import stats from './stats'
import autocomplete from './autocomplete'
import email from './email'
import cadastre from './cadastre'
import preferences from './system-preferences'
import { setupUserRoutes } from './user'
import appErrorHandler from './infrastructure/error-handler'
import maintenanceMode from './system-preferences/maintenance-mode-middleware'
import { setupCallerRoutes } from './caller/init'
import { initFlipperModule } from './flipper/init'
import { setupStockRouter } from './stock/stock-router'

let app
export const createApp = () => {
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

  return couchbase()
    .then(couchbaseBucket => {
      const diContainer = createDiContainer(
        couchbaseBucket,
        process.env.FORCE_MAX_CONSISTENCY === 'true'
      )
      app.locals.diContainer = diContainer

      operator(app) // start with login router

      setupUserRoutes(app, diContainer)
      setupBuildingRoutesAndListeners(app, diContainer)
      setupOwnersRoutes(app, diContainer)

      setupScheduledEventsRoutes(app, diContainer)
      setupWorksheetRoutesAndEventListeners(app, diContainer)
      createTestHarness(app, diContainer)
      initPropertyManager(app, diContainer)
      initFlipperModule(app, diContainer)
      setupCallerRoutes(app, diContainer)
      setupStockRouter(app, diContainer)

      stats(app, diContainer)
      webhooks(app)
      maintenanceMode(app)
      calls(app)
      history(app)
      notes(app)
      metadata(app)
      autocomplete(app)
      email(app)
      cadastre(app)
      preferences(app)

      app.use(appErrorHandler)
      app.set('IS_READY', true)

      return app
    })
    .catch(error => {
      logger.error('error starting application', { error })
      throw error
    })
}
