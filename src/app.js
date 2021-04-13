import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import cors from 'cors'

import couchbase from './db/couchbase'
import { logger } from './infrastructure/logger'
// app aware types
import './types'
import {
  createAwilixContainer,
  createDependenciesContainer,
  createLegacyDependenciesContainer
} from './infrastructure/dependencies'
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

const app = express()
app.set('IS_READY', false)
export const dependenciesPromise = couchbase()

dependenciesPromise.then(couchbaseBucket => {
  const legacyDependenciesContainer = createLegacyDependenciesContainer(app.locals.bucket)
  const awilixContainer = createAwilixContainer(couchbaseBucket, process.env.FORCE_MAX_CONSISTENCY === 'true')
  const dependenciesContainer = createDependenciesContainer(app.locals.bucket, legacyDependenciesContainer, awilixContainer)

  setupUserRoutes(app, awilixContainer)

  setupBuildingRoutesAndListeners(app, awilixContainer, dependenciesContainer)
  setupOwnersRoutes(app, awilixContainer)
  setupScheduledEventsRoutes(app, awilixContainer)
  setupWorksheetRoutesAndEventListeners(app, awilixContainer)

  createTestHarness(app, awilixContainer)
  initPropertyManager(app, awilixContainer)
  initFlipperModule(app, awilixContainer)
  setupCallerRoutes(app, awilixContainer)
  setupStockRouter(app, awilixContainer)
  stats(app, awilixContainer)
  app.use(appErrorHandler)

  app.locals.dependenciesContainer = dependenciesContainer
  app.locals.legacyDependenciesContainer = legacyDependenciesContainer
  app.locals.diContainer = awilixContainer

  app.set('IS_READY', true)
}).catch(error => {
  logger.error('error starting application', { error })
  throw error
})

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

webhooks(app)
maintenanceMode(app)
operator(app)
calls(app)
history(app)
notes(app)
metadata(app)
autocomplete(app)
email(app)
cadastre(app)
preferences(app)

export default app
