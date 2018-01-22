import {Router} from 'express';
import {importBuildingController, listController} from './controllers';

const router = Router();

router.get('/buildings', listController);
router.post('/buildings', importBuildingController);

export default router;
