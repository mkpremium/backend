import {Router} from 'express';
import {
  worksheetFindByIdController, worksheetListController, queueByCityController, queueListController,
  openWorksheetController
} from './controllers';
import {permissions} from '../middleware/jwt';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Worksheet
 *   description: Ficha de trabajo
 */

/**
 * @swagger
 * tags:
 *   name: Worksheet Queue
 *   description: Cola de fichas de trabajo
 */

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrador del sistema
 */

/**
 * @swagger
 * /worksheets:
 *   get:
 *     tags: [Worksheet, Manager]
 *     summary: Obtiene el listado de fichas de trabajo
 *     security:
 *       - manager: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *         description: Cantidad máxima a de registros a recibir
 *         default: 20
 *       - name: offset
 *         in: query
 *         type: number
 *         description: Numero de registros a saltar
 *         default: 0
 *       - name: status
 *         in: query
 *         type: string
 *         description: Estado de la worksheet
 *       - name: viewedAt
 *         in: query
 *         type: string
 *         format: dd-mm-YYYY
 *       - name: viewedBetween
 *         in: query
 *         type: array
 *         items:
 *           type: string
 *           format: dd-mm-YYYY
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           type: array
 *           items:
 *             $ref: "#/definitions/Worksheet"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/', permissions.manager, worksheetListController);

/**
 * @swagger
 * /worksheets/queues:
 *   get:
 *     tags: [Queue, Admin]
 *     security:
 *       - admin: []
 *     summary: Lista todas las colas del sistema
 *     responses:
 *       200:
 *         description: Lista las colas
 *         schema:
 *           type: array
 *           items:
 *             $ref: "#/definitions/WorksheetQueue"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/queues', permissions.admin, queueListController);

/**
 * @swagger
 * /worksheets/{id}:
 *   get:
 *     tags: [Worksheet, Manager, Operator]
 *     security:
 *       - manager: []
 *       - operator: []
 *     summary: Obtiene el detalle de una Ficha de trabajo
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Id de la ficha de trabajo
 *         required: true
 *         type: string
 *         format: uuid/v4
 *     responses:
 *       200:
 *         description: Obtiene la ficha
 *         schema:
 *           $ref: "#/definitions/Worksheet"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       404:
 *         description: Ficha no encontrada
 */
router.get('/:id', worksheetFindByIdController);

/**
 * @swagger
 * /worksheets/queues/{city}:
 *   get:
 *     tags: [Queue, Operator, Manager]
 *     security:
 *       - manager: []
 *       - operator: []
 *     summary: Obtiene la cola de fichas de trabajo para una ciudad dada
 *     parameters:
 *       - name: city
 *         in: path
 *         description: Ciudad de la cola de trabajo
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Devuelve cola de fichas de trabajo
 *         schema:
 *           $ref: "#/definitions/WorksheetQueue"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       404:
 *         description: Ciudad no encontrada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/queues/:city', queueByCityController);

/**
 * @swagger
 * /worksheets/queues/{city}:
 *   post:
 *     tags: [Queue, Operator]
 *     security:
 *       - operator: []
 *     summary: Abre y Obtiene el detalle de una Ficha de trabajo para ser trabajada
 *     parameters:
 *       - name: city
 *         in: path
 *         description: Ciudad de la cola de trabajo
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/QueueRequestParams"
 *     responses:
 *       200:
 *         description: Abre y Obtiene la ficha con exito
 *         schema:
 *           $ref: "#/definitions/Worksheet"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       404:
 *         description: Ciudad no encontrada o Item no encontrado en cola
 *         schema:
 *           $ref: "#/definitions/Error"
 *       409:
 *         description: El item no esta disponible para su apertura
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/queues/:city', openWorksheetController);

export default router;
