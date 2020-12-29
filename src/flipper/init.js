import jwt from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { asFunction } from 'awilix'
import { createFlipperAvailabilityController } from './controller/flipper-availability.controller'

export const initFlipperModule = (app, awilixContainer) => {
  const secured = jwt()

  awilixContainer.register({
    flipperAvailabilityController: asFunction(createFlipperAvailabilityController)
  })
  app.use('/flipper',
    secured,
    createRouter(awilixContainer)
  )
}

const createRouter = awilixContainer => {
  const router = new Router()
  router.get('/:flipperId/availability', wrap(awilixContainer.resolve('flipperAvailabilityController')))

  return router
}
