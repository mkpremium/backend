import { Router } from 'express'
import { oldAppErrorHandler } from '../lib/error-handler'
import {
  getBuildingsLocationController,
  getCityInfoController,
  getNeighborhoodCenterController,
  oldLoginController,
  updateNeighborhoodController,
  updateOperatorStateController
} from './controllers'

const router = Router()
router.post('/api/users', oldLoginController)
router.post('/api/changeUserNeighborhood', updateNeighborhoodController)
router.post('/api/changeUserState', updateOperatorStateController)
router.post('/api/getNeighborhoodCenter', getNeighborhoodCenterController)
router.post('/api/getBuildingsGeojson', getBuildingsLocationController)
router.post('/api/getCityInfo', getCityInfoController)
router.use(oldAppErrorHandler)

export default router
