import { permissions } from '../middleware/jwt'
import { Router } from 'express'
import { wrap } from 'express-promise-wrap'

export function flipperRoutes (app, container, secured) {
  app.use('/flipper', secured, createRouter(container))
}

function createRouter (container) {
  const router = Router()
  router.get('/:flipperId/blocked-availability', wrap(container.resolve('flipperBlockedAvailabilityController')))
  router.put('/:flipperId/max-line', permissions.admin, wrap(container.resolve('setFlipperMaxLineController')))

  return router
}
