import jwt from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { asClass, asFunction } from 'awilix'
import { createFlipperBlockedAvailabilityController } from './controller/flipper-availability.controller'
import { FlipperAvailabilityService } from './service/flipper-availability.service'
import { createSetFlipperMaxLineController } from './controller/set-flipper-max-line.controller'

export const initFlipperModule = (app, awilixContainer) => {
  const secured = jwt()

  awilixContainer.register({
    flipperAvailabilityService: asClass(FlipperAvailabilityService).singleton(),
    flipperBlockedAvailabilityController: asFunction(createFlipperBlockedAvailabilityController).singleton(),
    setFlipperMaxLineController: asFunction(createSetFlipperMaxLineController).singleton()
  })
  app.use('/flipper',
    secured,
    createRouter(awilixContainer)
  )
}

const createRouter = awilixContainer => {
  const router = new Router()
  router.get('/:flipperId/blocked-availability', wrap(awilixContainer.resolve('flipperBlockedAvailabilityController')))
  router.put('/:flipperId/max-line', wrap(awilixContainer.resolve('setFlipperMaxLineController')))

  return router
}
