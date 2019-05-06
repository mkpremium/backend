import {Router} from 'express';
import {createBuildingController} from './controllers';

const router = Router();

router.post('/', createBuildingController);

export default router;
