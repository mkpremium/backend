import jwt, { permissions } from '../middleware/jwt'
import { Router } from 'express'
import { createGetNextCallerWorksheetController } from './controller/get-next-worksheet.controller'
import { asFunction } from 'awilix'
import { wrap } from 'express-promise-wrap'
import { createTakeWorksheetInQueueController } from './controller/take-worksheet-in-queue.controller'
import { createAssignFlipperToCallerController } from './controller/assign-flipper-to-caller.controller'

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
    takeWorksheetInQueueController: asFunction(createTakeWorksheetInQueueController),
    assignFlipperToCallerController: asFunction(createAssignFlipperToCallerController)
  })

  router.post('/next-worksheet', wrap(awilixContainer.resolve('getNextCallerWorksheetController')))
  router.post('/assigned-queue/:worksheetId', wrap(awilixContainer.resolve('takeWorksheetInQueueController')))
  router.put('/:callerId/flippers/:flipperId', permissions.admin, wrap(awilixContainer.resolve('assignFlipperToCallerController')))

  return router
}
