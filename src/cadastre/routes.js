import { Router } from 'express'
import {
  getCitiesController,
  getBuildingByAddressController,
  getProvincesController,
  getStreetsController, getBuildingByCadastreController
} from './controllers'

const router = Router({})

router.get('/provinces', getProvincesController)

router.get('/cities', getCitiesController)

router.get('/streets', getStreetsController)

router.post('/complete-info', getBuildingByAddressController)

router.post('/building-by-address', getBuildingByAddressController)

router.post('/building-by-cadastre', getBuildingByCadastreController)

export default router
