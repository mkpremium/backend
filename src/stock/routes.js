import {Router} from 'express';
import {addBuildingToStockController} from './controllers';

const router = Router();

router.post('/', addBuildingToStockController);

export default router;
