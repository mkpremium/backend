import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import cors from 'cors'

import couchbase from './db/couchbase'
// app aware types
import './types'
import { CouchbaseAdapter } from './db/CouchbaseAdapter'
// modules
import operator from './operator'
import worksheet from './worksheet'
import owner from './owner'
import swagger from './swagger'
import calls from './calls'
import scheduledEvents from './scheduled-events'
import migration from './migration'
import webhooks from './webhooks'
import socket from './socket'
import history from './history'
import notes from './notes'
import building from './building'
import metadata from './metadata'
import people from './person'
import stats from './stats'
import street from './street'
import autocomplete from './autocomplete'
import email from './email'
import gearman from './gearman'
import cadastre from './cadastre'
import preferences from './system-preferences'
import stock from './stock'
import featuredOwner from './featuredOwner'
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
  const dependenciesContainer = {
    couchbaseBucket: app.locals.bucket,
    couchbaseAdapter: new CouchbaseAdapter(app.locals.bucket)
  }

  stock(app, dependenciesContainer)
  featuredOwner(app, dependenciesContainer)
  user(app, dependenciesContainer)
}).catch(err => {
  console.error(err)
})

app.get('/_ready', (req, res) => {
  if (app.get('IS_READY')) res.sendStatus(200)
  else res.sendStatus(503)
})

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}
app.use(cors())

swagger(app)
webhooks(app)
gearman(app)
maintenanceMode(app)
operator(app)
worksheet(app)
owner(app)
calls(app)
scheduledEvents(app)
history(app)
migration(app)
notes(app)
building(app)
metadata(app)
people(app)
stats(app)
street(app)
autocomplete(app)
email(app)
cadastre(app)
preferences(app)
app.use(appErrorHandler)

export default app
