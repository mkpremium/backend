import { Router } from 'express'
import {
  createOperatorController,
  limitedListOperatorController,
  listOperatorController,
  loginController,
  selfCallCenterWorkInProgressController,
  refreshTokenController,
  updateOperatorController
} from './controllers'
import { permissions } from '../middleware/jwt'

const router = Router()

router.post('/login', loginController)

router.post('/refresh-token', refreshTokenController)

router.post('/', permissions.allManagers, createOperatorController)

router.put('/:id', permissions.allManagers, updateOperatorController)

router.get('/', permissions.admin, listOperatorController)
router.get('/business', limitedListOperatorController)

router.get('/me', selfCallCenterWorkInProgressController)

export default router
