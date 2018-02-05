import {Router} from 'express';
import {findByIdController, listController} from './controllers';

const router = Router();
const dummyController = (req, res) => res.send();

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
 * /worksheets:
 *   get:
 *     tags: [Worksheet, Manager]
 *     summary: Obtiene el listado de fichas de trabajo
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
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           type: array
 *           items:
 *             $ref: "#/definitions/Worksheet"
 */
router.get('/', listController);

/**
 * @swagger
 * /worksheets/{id}:
 *   get:
 *     tags: [Worksheet, Manager, Operator]
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
router.get('/:id', findByIdController);

/**
 * @swagger
 * /queues/{city}:
 *   get:
 *     tags: [Queue, Operator, Manager]
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
router.get('/queues/:city', dummyController);

/**
 * @swagger
 * /queues:
 *   get:
 *     tags: [Queue, Admin]
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
 */
router.get('/queues', dummyController);

/**
 * @swagger
 * /queues/{city}:
 *   post:
 *     tags: [Queue, Operator]
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
 *           properties:
 *             queueItemId:
 *               description: Id del item de la cola *
 *               type: string
 *               format: uuid/v4
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
router.post('/queues/:id', dummyController);

export default router;
