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
import worksheet from './worksheet'
import owner from './owner'
import calls from './calls'
import scheduledEvents from './scheduled-events'
import webhooks from './webhooks'
import socket from './socket'
import history from './history'
import notes from './notes'
import building from './building'
import metadata from './metadata'

import stats from './stats'
import autocomplete from './autocomplete'
import email from './email'
import cadastre from './cadastre'
import preferences from './system-preferences'
import stock from './stock'
import featuredOwner from './featuredOwner'
import meeting from './meeting'
import user from './user'
import appErrorHandler from './lib/error-handler'
import maintenanceMode from './system-preferences/maintenance-mode-middleware'

const app = express()
app.set('IS_READY', false)
export const dependenciesPromise = Promise.all([
  couchbase(app),
  socket.initModel()
])

dependenciesPromise.then(() => {
  app.set('IS_READY', true)

  const legacyDependenciesContainer = createLegacyDependenciesContainer(app.locals.bucket)
  const dependenciesContainer = createDependenciesContainer(app.locals.bucket, legacyDependenciesContainer)

  stock(app, dependenciesContainer)
  featuredOwner(app, dependenciesContainer)
  meeting(app, dependenciesContainer)
  user(app, dependenciesContainer)
  building(app, dependenciesContainer, legacyDependenciesContainer)
  owner(app, dependenciesContainer)
  scheduledEvents(app, dependenciesContainer)
  worksheet(app, dependenciesContainer, legacyDependenciesContainer)
  app.use(appErrorHandler)

  app.locals.dependenciesContainer = dependenciesContainer
  app.locals.legacyDependenciesContainer = legacyDependenciesContainer
}).catch(errors => {
  logger.error('error starting application', { errors })
  process.exit(1)
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
stats(app)
autocomplete(app)
email(app)
cadastre(app)
preferences(app)

export default app
