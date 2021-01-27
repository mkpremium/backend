import jwt, { permissions } from '../middleware/jwt'
import { Router } from 'express'
import { createGetNextCallerWorksheetController } from './controller/get-next-worksheet.controller'
import { asFunction } from 'awilix'
import { wrap } from 'express-promise-wrap'
import { createTakeWorksheetInQueueController } from './controller/take-worksheet-in-queue.controller'
import { createAssignFlipperToCallerController } from './controller/assign-flipper-to-caller.controller'
import { AssignFlipperToCallerService } from './service/assign-flipper-to-caller.service'
import { createAssignedFlipperBlockedAvailabilityController } from './controller/assigned-flipper-blocked-availability.controller'
import { createAssignedFlipperScheduleMeetingController } from './controller/assigned-flipper-schedule-meeting.controller'

export const setupCallerDependencies = awilixContainer => {
  awilixContainer.register({
    getNextCallerWorksheetController: asFunction(createGetNextCallerWorksheetController),
    takeWorksheetInQueueController: asFunction(createTakeWorksheetInQueueController),
    assignedFlipperBlockedAvailabilityController: asFunction(createAssignedFlipperBlockedAvailabilityController),
    assignedFlipperScheduleMeetingController: asFunction(createAssignedFlipperScheduleMeetingController),
    assignFlipperToCallerController: asFunction(createAssignFlipperToCallerController)
      .inject(() => {
        return ({
          assignFlipperToCallerService: new AssignFlipperToCallerService(
            awilixContainer.resolve('scheduledCallsService'), awilixContainer.resolve('usersRepository')
          )
        })
      })
  })
}

export const setupCallerRoutes = (app, awilixContainer) => {
  const secured = jwt()

  app.use('/caller',
    secured,
    createRouter(awilixContainer)
  )
}

const createRouter = awilixContainer => {
  const router = new Router()

  router.post('/next-worksheet', permissions.operator, wrap(awilixContainer.resolve('getNextCallerWorksheetController')))
  router.post('/assigned-queue/:worksheetId', wrap(awilixContainer.resolve('takeWorksheetInQueueController')))
  router.put('/:callerId/flippers/:flipperId', permissions.admin, wrap(awilixContainer.resolve('assignFlipperToCallerController')))
  router.get('/assigned-flipper/blocked-availability', wrap(awilixContainer.resolve('assignedFlipperBlockedAvailabilityController')))
  router.post('/assigned-flipper/meetings', wrap(awilixContainer.resolve('assignedFlipperScheduleMeetingController')))

  return router
}
