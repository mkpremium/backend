import jwt from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { asClass, asFunction } from 'awilix'
import { createFlipperBlockedAvailabilityController } from './controller/flipper-availability.controller'
import { FlipperAvailabilityService } from './service/flipper-availability.service'

export const initFlipperModule = (app, awilixContainer) => {
  const secured = jwt()

  awilixContainer.register({
    flipperAvailabilityService: asClass(FlipperAvailabilityService),
    flipperBlockedAvailabilityController: asFunction(createFlipperBlockedAvailabilityController)
  })
  app.use('/flipper',
    secured,
    createRouter(awilixContainer)
  )
}

const createRouter = awilixContainer => {
  const router = new Router()
  router.get('/:flipperId/blocked-availability', wrap(awilixContainer.resolve('flipperBlockedAvailabilityController')))

  return router
}
