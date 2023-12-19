import { asClass, asFunction } from 'awilix'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { CallerRepository } from './caller.repository'
import { createAssignFlipperToCallerController } from './controller/assign-flipper-to-caller.controller'
import {
  createAssignedFlipperBlockedAvailabilityController
} from './controller/assigned-flipper-blocked-availability.controller'
import {
  createAssignedFlipperScheduleMeetingController
} from './controller/assigned-flipper-schedule-meeting.controller'
import { createGetNextCallerWorksheetController } from './controller/get-next-worksheet.controller'
import { createTakeWorksheetInQueueController } from './controller/take-worksheet-in-queue.controller'
import { AssignFlipperToCallerService } from './service/assign-flipper-to-caller.service'

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
      }),
    callerRepository: asClass(CallerRepository).singleton().classic()
  })
}

export const setupCallerRoutes = (app, awilixContainer, secured) => {
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
