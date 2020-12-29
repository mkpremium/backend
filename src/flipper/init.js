import jwt from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { asFunction } from 'awilix'
import { createFlipperAvailabilityController } from './controller/flipper-availability.controller'
import { FlipperAvailabilityService } from './service/flipper-availability.service'

export const initFlipperModule = (app, awilixContainer) => {
  const secured = jwt()

  awilixContainer.register({
    flipperAvailabilityController: asFunction(createFlipperAvailabilityController).inject(() => {
      return { flipperAvailabilityService: new FlipperAvailabilityService() }
    })
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
