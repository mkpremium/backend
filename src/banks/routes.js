import {Router} from 'express';
import {listBankFilesController, uploadBankFileController} from './controllers';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Banks
 *   description: Bancos
 */

/**
 * @swagger
 * /banks/files:
 *   get:
 *     tags: [Banks]
 *     security:
 *       - banks: []
 *     summary: Obtienes los 5 archivos cargados más recientes
 *     description:
 *      Este endpoint sirve para conocer los archivos cargados previamente
 *      úselo para mostrar data inicial al usuario, por la forma en que esta hecho
 *      el sistema actual puede que solo necesite el primero del listado.
 *
 *      En caso de no existir archivos cargados previamente devolverá un array vació
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     responses:
 *       200:
 *         description: Lista de notas
 *         schema:
 *           $ref: "#/definitions/BankListResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/files', listBankFilesController);
router.post('/files', uploadBankFileController);
router.get('/files/:id');

router.get('/filters');

router.post('/filtered-files');
router.post('/filtered-files/:id');
router.put('/filtered-files/:id');
router.post('/filtered-files/:id/export');

export default router;
