import {Router} from 'express';
import {oldAppErrorHandler} from '../lib/error-handler';
import {updateNeighborhoodController, updateOperatorStateController} from '../operator/controllers';

const router = Router();

router.post('/changeUserNeighborhood', updateNeighborhoodController);
router.post('/changeUserState', updateOperatorStateController);
router.use(oldAppErrorHandler);

export default router;
