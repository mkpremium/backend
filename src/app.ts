import cors from 'cors'
import express, { Express } from 'express'
import morgan from 'morgan'
import { buildingRoutes } from './building/routing'
import { setupCallerRoutes } from './caller/init'

import email from './email'
import { createDiContainer } from './infrastructure/dependencies'
import appErrorHandler from './infrastructure/error-handler'
import { initLogger } from './infrastructure/logger'
import notes from './notes'
// modules
import operator from './operator'
import { init as initPropertyManager } from './property-manager'
import { setupStockRouter } from './stock/stock-router'
import { createTestHarness } from './test-harness/routes'
// app aware types
import './types'
import { worksheetsRoutes } from './worksheet/routing'
import { EventsDiagnostics } from './infrastructure/event-bus'
import { setupOwnersRoutes } from './owner/routing'
import { scheduledEventsRoutes } from './scheduled-events/routing'
import { flipperRoutes } from './flipper/routing'
import { setupUserRoutes } from './user/routing'
import { startListeners } from './infrastructure/listeners'
import { Database } from './infrastructure/database'
import jwt from './middleware/jwt'

export const createApp = async (database: Database): Promise<Express> => {
  const logger = initLogger()
  logger.info('starting app', { database })

  const app = express()

  app.set('IS_READY', false)
  app.get('/_ready', (req, res) => {
    if (app.get('IS_READY')) {
      res.sendStatus(200)
    } else {
      res.sendStatus(503)
    }
  })

  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())
  app.use(morgan('combined'))
  app.use(cors())

  try {
    const diContainer = await createDiContainer(database)

    app.locals.diContainer = diContainer

    const secured = jwt(diContainer.resolve('usersRepository'))

    operator(app, diContainer, secured) // start with login router
    setupUserRoutes(app, diContainer, secured)
    buildingRoutes(diContainer, app, secured)
    setupOwnersRoutes(app, diContainer, secured)
    scheduledEventsRoutes(diContainer, app, secured)
    worksheetsRoutes(app, diContainer, secured)
    createTestHarness(app, diContainer, secured)
    initPropertyManager(app, diContainer, secured)
    setupCallerRoutes(app, diContainer, secured)
    flipperRoutes(app, diContainer, secured)
    setupStockRouter(app, diContainer, secured)

    notes(app, diContainer, secured)
    email(app, secured)

    await startListeners(diContainer)

    app.use(appErrorHandler)
    app.set('IS_READY', true)
    const eventBus: EventsDiagnostics = diContainer.resolve('eventBus')
    logger.info('App is ready', {
      eventSubscribersInfo: eventBus.info
    })

    return app
  } catch (error) {
    logger.error('error starting application', { error, stack: error.stack, errorMessage: error.messge })
    process.exit(1)
  }
}
