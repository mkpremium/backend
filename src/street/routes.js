import {Router} from 'express';
import {oldAppErrorHandler} from '../lib/error-handler';
import {updateNeighborhoodController} from '../operator/controllers';

const router = Router();

router.post('/changeUserNeighborhood', updateNeighborhoodController);
router.use(oldAppErrorHandler);

export default router;
