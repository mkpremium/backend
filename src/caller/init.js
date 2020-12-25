import jwt from '../middleware/jwt'
import { Router } from 'express'
import { createGetNextCallerWorksheetController } from './controller/get-next-worksheet.controller'
import { asFunction } from 'awilix'
import { wrap } from 'express-promise-wrap'
import { createTakeWorksheetInQueueController } from './controller/take-worksheet-in-queue.controller'

export const initCallerModule = (app, awilixContainer) => {
  const secured = jwt()

  app.use('/caller',
    secured,
    createRouter(awilixContainer)
  )
}

const createRouter = (awilixContainer) => {
  const router = new Router()

  awilixContainer.register({
    getNextCallerWorksheetController: asFunction(createGetNextCallerWorksheetController),
    takeWorksheetInQueueController: asFunction(createTakeWorksheetInQueueController)
  })

  router.post('/next-worksheet', wrap(awilixContainer.resolve('getNextCallerWorksheetController')))
  router.post('/assigned-queue/:worksheetId', wrap(awilixContainer.resolve('takeWorksheetInQueueController')))

  return router
}
