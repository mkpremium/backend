import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import {
  createAddOperatorController,

  limitedListOperatorController,
  listOperatorController,
  refreshTokenController,
  updateOperatorController
} from './controllers'

export function operatorRouter (diContainer) {
  const router = Router()

  router.post('/login', wrap(diContainer.resolve('loginController')))

  router.post('/refresh-token', refreshTokenController)

  router.post('/', permissions.allManagers, wrap(createAddOperatorController(diContainer.resolve('addOperatorService'))))

  router.put('/:id', permissions.allManagers, updateOperatorController)

  router.get('/', permissions.admin, listOperatorController)
  router.get('/business', limitedListOperatorController)

  return router
}
