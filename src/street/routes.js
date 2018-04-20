import {Router} from 'express';
import {oldAppErrorHandler} from '../lib/error-handler';
import {
  getBuildingsLocationController, getCityInfoController,
  getNeighborhoodCenterController,
  updateNeighborhoodController,
  updateOperatorStateController
} from './controllers';

const router = Router();

router.post('/changeUserNeighborhood', updateNeighborhoodController);
router.post('/changeUserState', updateOperatorStateController);
router.post('/getNeighborhoodCenter', getNeighborhoodCenterController);
router.post('/getBuildingsGeojson', getBuildingsLocationController);
router.post('/getCityInfo', getCityInfoController);
router.use(oldAppErrorHandler);

export default router;
