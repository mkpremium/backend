import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import cors from 'cors'

import couchbase from './db/couchbase'
import { logger } from './infrastructure/logger'
// app aware types
import './types'
import { createDependenciesContainer, createLegacyDependenciesContainer } from './infrastructure/dependencies'
// modules
import operator from './operator'
import { createTestHarness } from './test-harness/routes'
import worksheet from './worksheet'
import {setupOwnerDependencies, setupOwnersRoutes} from './owner'
import calls from './calls'
import scheduledEvents from './scheduled-events'
import webhooks from './webhooks'
import history from './history'
import notes from './notes'
import { oldInit, setupDependencies as setupBuildingDependencies } from './building'
import metadata from './metadata'
import { init as initPropertyManager } from './property-manager'

import stats from './stats'
import autocomplete from './autocomplete'
import email from './email'
import cadastre from './cadastre'
import preferences from './system-preferences'
import stock from './stock'
import featuredOwner from './featuredOwner'
import meeting from './meeting'
import user from './user'
import appErrorHandler from './infrastructure/error-handler'
import maintenanceMode from './system-preferences/maintenance-mode-middleware'
import { initCallerModule } from './caller/init'
import { asValue, createContainer } from 'awilix'
import { initFlipperModule } from './flipper/init'

const app = express()
app.set('IS_READY', false)
export const dependenciesPromise = Promise.all([
  couchbase(app)
])

dependenciesPromise.then(() => {
  const legacyDependenciesContainer = createLegacyDependenciesContainer(app.locals.bucket)
  const dependenciesContainer = createDependenciesContainer(app.locals.bucket, legacyDependenciesContainer)

  const awilixContainer = createContainer()
  awilixContainer.register({
    couchbaseAdapter: asValue(dependenciesContainer.couchbaseAdapter)
  })

  awilixContainer.register({
    eventBus: asValue(dependenciesContainer.eventBus)
  })
  setupBuildingDependencies(awilixContainer)
  setupOwnerDependencies(awilixContainer)

  stock(app, dependenciesContainer)
  featuredOwner(app, dependenciesContainer)
  meeting(app, dependenciesContainer)
  user(app, awilixContainer)

  oldInit(app, awilixContainer, dependenciesContainer)
  setupOwnersRoutes(app, awilixContainer)
  scheduledEvents(app, awilixContainer)
  worksheet(app, awilixContainer)

  createTestHarness(app, awilixContainer)
  initPropertyManager(app, dependenciesContainer)
  initFlipperModule(app, awilixContainer)
  initCallerModule(app, awilixContainer)
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
  if (app.get('IS_READY')) res.sendStatus(200)
  else res.sendStatus(503)
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
