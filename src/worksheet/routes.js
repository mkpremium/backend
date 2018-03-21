import {Router} from 'express';
import {
  worksheetFindByIdController, worksheetListController, queueByCityController, queueListController,
  actionsOnWorksheetQueueController, queueTakenFindByOperatorController, addOwnerToWorksheetController
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
 *   name: Queue
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
 * tags:
 *   name: Comercial
 *   description: Comerciales
 */

/**
 * @swagger
 * /worksheets:
 *   get:
 *     tags: [Worksheet, Manager]
 *     summary: Obtiene el listado de fichas de trabajo
 *     security:
 *       - manager: []
 *       - admin: []
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
 *         description: Lista de hojas de trabajo
 *         schema:
 *           $ref: "#/definitions/WorkSheetLitResponse"
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
 *           $ref: "#/definitions/QueueListResponse"
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
 *       - admin: []
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
 * /worksheets/{id}/owners:
 *   post:
 *     summary: Crea un nuevo propietario relacionado a la hoja de trabajo
 *     tags: [Worksheet, Manager, Operator]
 *     security:
 *       - operator: []
 *       - manager: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Id de la ficha de trabajo
 *         required: true
 *         type: string
 *         format: uuid/v4
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/OwnerBody"
 *     responses:
 *       201:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/Owner"
 *       400:
 *         description: Solicitud incorrecta
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 *       404:
 *         description: Hoja de trabajo no encontrada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/:id/owners', addOwnerToWorksheetController);

/**
 * @swagger
 * /worksheets/queues/{city}:
 *   get:
 *     tags: [Queue, Operator, Manager]
 *     security:
 *       - manager: []
 *       - operator: []
 *       - admin: []
 *     summary: Obtiene la cola de fichas de trabajo para una ciudad dada
 *     parameters:
 *       - name: extra
 *         in: query
 *         description: Incluye información adicional a los items de la cola
 *         default: false
 *         type: boolean
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
 * /worksheets/queues/{city}/taken:
 *   get:
 *     tags: [Manager, Operator]
 *     security:
 *       - manager: []
 *       - operator: []
 *       - admin: []
 *     summary: Devuelve el item activo por el operador
 *     parameters:
 *       - name: city
 *         in: path
 *         description: Ciudad de la cola de trabajo
 *         required: true
 *         type: string
 *       - name: operatorId
 *         in: query
 *         description: Especifica el operador a consultar (solo manager)
 *     responses:
 *       200:
 *         description: Operación exitosa
 */
router.get('/queues/:city/taken', queueTakenFindByOperatorController);

/**
 * @swagger
 * /worksheets/queues/{city}:
 *   post:
 *     tags: [Queue, Operator]
 *     security:
 *       - operator: []
 *       - admin: []
 *     summary: Realiza acciones sobre el item de la cola
 *     description: Permite realizar acciones como tomar o liberar el item de la cola
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
 *         description: Toma el item de la cola
 *         schema:
 *           $ref: "#/definitions/Worksheet"
 *       204:
 *         description: Libera la cola correctamente
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
router.post('/queues/:city', actionsOnWorksheetQueueController);

export default router;
