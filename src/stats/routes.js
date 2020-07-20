import { Router } from 'express'
import {
  overAllController,
  overProvincesController,
  ownerBusinessStatsController,
  ownerStatsController,
  performanceController,
  worksheetStatsController
} from './controller'
import { permissions } from '../middleware/jwt'

const router = Router()

router.get('/', permissions.manager, overAllController)

router.get('/cities', permissions.manager, overProvincesController)

router.get('/performance', permissions.manager, performanceController)

router.get('/owner', permissions.manager, ownerStatsController)

router.get('/worksheets', permissions.manager, worksheetStatsController)

router.get('/owner-business', permissions.manager, ownerBusinessStatsController)

export default router
