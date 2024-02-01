import { Router } from 'express'
import { wrap } from 'express-promise-wrap'
import { permissions } from '../middleware/jwt'
import { createAddOperatorController } from './controllers'

export function operatorRouter (diContainer) {
  const router = Router()

  router.post('/login', wrap(diContainer.resolve('loginController')))

  router.post('/', permissions.allManagers, wrap(createAddOperatorController(diContainer.resolve('addOperatorService'))))

  router.put('/:id', permissions.allManagers, wrap(diContainer.resolve('updateOperatorController')))

  router.get('/', permissions.admin, wrap(diContainer.resolve('listOperatorController')))

  return router
}
