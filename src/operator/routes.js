import { Router } from 'express'
import { permissions } from '../middleware/jwt'
import {
  createOperatorController,
  limitedListOperatorController,
  listOperatorController,
  refreshTokenController,
  selfCallCenterWorkInProgressController,
  updateOperatorController
} from './controllers'

export function operatorRouter (diContainer) {
  const router = Router()

  router.post('/login', diContainer.resolve('loginController'))

  router.post('/refresh-token', refreshTokenController)

  router.post('/', permissions.allManagers, createOperatorController)

  router.put('/:id', permissions.allManagers, updateOperatorController)

  router.get('/', permissions.admin, listOperatorController)
  router.get('/business', limitedListOperatorController)

  router.get('/me', selfCallCenterWorkInProgressController)

  return router
}
