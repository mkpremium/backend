import {Router} from 'express';
import {
  actionBankFileDataController, actionBankFileDataWithXLSXController,
  calculateFiltersController, exportBankFileController,
  getBankFileController,
  listBankFilesController, removeBankFileController, updateBankCityDataController,
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
 *           $ref: "#/definitions/BankFileDetails"
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
 *      - name: body
 *        in: body
 *        schema:
 *          $ref: "#/definitions/BankFilterUserInput"
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

/**
 * @swagger
 * /banks/files/{id}/export:
 *   post:
 *     tags: [Banks]
 *     summary: Exporta las filas del archivo en formato XLSX
 *     security:
 *       - banks: []
 *       - banks_api: []
 *     consumes:
 *      - "application/json"
 *     parameters:
 *      - name: id
 *        type: string
 *        in: path
 *        required: true
 *      - name: body
 *        in: body
 *        schema:
 *          $ref: "#/definitions/BankFileExportInput"
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           type: file
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/files/:id/export', exportBankFileController);

/**
 * @swagger
 * /banks/files/{id}/{action}:
 *   post:
 *     tags: [Banks]
 *     summary: Actualizar blacklisted or whitelisted filtros
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
 *      - name: action
 *        type: string
 *        in: path
 *        required: true
 *        enum: [blacklisted, whitelisted]
 *      - name: body
 *        in: body
 *        schema:
 *          $ref: "#/definitions/BankFilterUpdateInput"
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/BankFile"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/files/:id/:action', actionBankFileDataController);

/**
 * @swagger
 * /banks/files/{id}/{action}/xlsx:
 *   post:
 *     tags: [Banks]
 *     summary: Actualizar blacklisted or whitelisted filtros via XLSX
 *     security:
 *       - banks: []
 *       - banks_api: []
 *     consumes:
 *      - multipart/form-data
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: id
 *        type: string
 *        in: path
 *        required: true
 *      - name: action
 *        type: string
 *        in: path
 *        required: true
 *        enum: [blacklisted, whitelisted]
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
router.post('/files/:id/:action/xlsx', actionBankFileDataWithXLSXController);

/**
 * @swagger
 * /banks/files/{id}/:
 *   delete:
 *     tags: [Banks]
 *     summary: Elimina un bank file, en caso de estas siendo procesado se desocuparan los workers
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
 *       204:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/BankFile"
 *       404:
 *         description: No existe el archivo
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.delete('/files/:id', removeBankFileController);

/**
 * @swagger
 * /banks/cities/xlsx:
 *   post:
 *     tags: [Banks]
 *     summary: Refresca el listado actual de ciudades
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
 *       204:
 *         description: Operación exitosa
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
router.post('/cities/xlsx', updateBankCityDataController);

export default router;
