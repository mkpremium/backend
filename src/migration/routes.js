import {Router} from 'express';
import {migrationViewController, uploadFilesController} from './controllers';

const router = Router();

router.get('/', migrationViewController);
router.post('/', uploadFilesController);

export default router;
