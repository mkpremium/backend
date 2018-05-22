import {Router} from 'express';
import {
  calculateFiltersController,
  getBankFileController,
  listBankFilesController,
  uploadBankFileController
} from './controllers';

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
 *       - banks_api: []
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

/**
 * @swagger
 * /banks/files:
 *   post:
 *     tags: [Banks]
 *     summary: Carga un archivo de bancos
 *     security:
 *       - banks: []
 *       - banks_api: []
 *     consumes:
 *      - multipart/form-data
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: file
 *        type: file
 *        in: formData
 *        required: true
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/BankFile"
 *       400:
 *         description: Solicitud mal formada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *
 */
router.post('/files', uploadBankFileController);

/**
 * @swagger
 * /banks/files/{id}:
 *   get:
 *     tags: [Banks]
 *     summary: Obtiene los detalles de un archivo
 *     security:
 *       - banks: []
 *       - banks_api: []
 *     consumes:
 *      - "application/json"
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: id
 *        type: string
 *        in: path
 *        required: true
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/BankFile"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *
 */
router.get('/files/:id', getBankFileController);

/**
 * @swagger
 * /banks/files/{id}/calculate-filters:
 *   post:
 *     tags: [Banks]
 *     summary: Calcula las opciones de compra basados en los filtros pasados
 *     security:
 *       - banks: []
 *       - banks_api: []
 *     consumes:
 *      - "application/json"
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: id
 *        type: string
 *        in: path
 *        required: true
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/BankFile"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *
 */
router.post('/files/:id/calculate-filters', calculateFiltersController);

// router.get('/filters');
router.post('/filtered-files');
router.post('/filtered-files/:id');
router.put('/filtered-files/:id');
router.post('/filtered-files/:id/export');

export default router;
