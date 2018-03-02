import {Router} from 'express';

import {
  addScheduledEventController,
  findScheduledEventController,
  listScheduledEventController,
  updateScheduledEnventController,
  deleteScheduledEventController
} from './controllers';

import {permissions} from '../middleware/jwt';

const router = Router();
/**
 * @swagger
 * tags:
 *   name: ScheduledEvents
 *   description: Eventos Programdos
 */

/**
 * @swagger
 * /scheduled-events/{id}:
 *  get:
 *    tags: [ScehduledEvents]
 *    summary: Obtiene detalle del evento programado
 *    parameters:
 *      - name: id
 *        in: path
 *        description: Id del evento programado
 *        required: true
 *        type: string
 *        format: uuid/v4
 *    responses:
 *      200:
 *        description: Obtiene el evento programado
 *        schema:
 *           $ref: "#/definitions/ScheduledEvent
 *      401:
 *        description: Credenciales inválidos o cuenta deshabilitada
 *        schema:
 *          $ref: "#/definitions/Error"
 *      404:
 *        description: Evento no encontrada
 */
router.get('/:id', permissions.operator, findScheduledEventController);

/**
 * @swagger
 * /scheduled-events:
 *   get:
 *     tags: [ScheduledEvents]
 *     summary: Obtiene listado de eventos programados
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
 *       - name: userId
 *         in: query
 *         type: string
 *         format: uuid/v4
 *       - name: type
 *         in: query
 *         type: string
 *         description: CALLS | MEETINGS
 *       - name: notifyAt
 *         in: query
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 *       - name: createdAt
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD
 *       - name: eventDate
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD
 *       - name: eventDateBetween
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD,YYYY-MM-DD
 *       - name: createdBetween
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD,YYYY-MM-DD
 *       - name: notifyBetween
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD,YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Lista de eventos programados
 *         schema:
 *           $ref: "#/definitions/ScheduleEventsListResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/', permissions.operator, listScheduledEventController);

/**
 * @swagger
 * /scheduled-events:
 *   post:
 *    tags: [ScehduledEvents]
 *    summary: Registra evento programado
 *    description: Permite programar un evento
 *    consumes:
 *      - "application/json"
 *    produces:
 *      - "application/json"
 *    parameters:
 *      - name: body
 *        in: body
 *        required: true
 *        schema:
 *          $ref: "#/definitions/ScheduleEvent"
 *    responses:
 *      201:
 *        description: Operación exitosa
 *        schema:
 *          $ref: "#/definitions/ScheduleEvent"
 *      400:
 *        description: Solicitud incorrecta
 *        schema:
 *          $ref: "#/definitions/Error"
 *      401:
 *        description: Credenciales inválidos o cuenta deshabilitada
 *        schema:
 *          $ref: "#/definitions/Error"
 *      403:
 *        description: Permisos insuficientes
 *        schema:
 *          $ref: "#/definitions/Error"
*/
router.post('/', permissions.operator, addScheduledEventController);

/**
 * @swagger
 * /scheduled-events:
 *   put:
 *    tags: [ScehduledEvents]
 *    summary: Actualiza evento programado
 *    description: Permite actualizar un evento
 *    consumes:
 *      - "application/json"
 *    produces:
 *      - "application/json"
 *    parameters:
 *      - name: id
 *        in: path
 *        type: string
 *        format: uuid/v4
 *        required: true
 *        description: Id del evento programado
 *      - name: body
 *        in: body
 *        schema:
 *        $ref: "#/definitions/UpdateScheduledEvent"
 *    responses:
 *      204:
 *        description: Operación exitosa
 *      404:
 *        description: Evento no existe
 *        schema:
 *          $ref: "#/definitions/Error"
 *      401:
 *        description: Credenciales inválidos o cuenta deshabilitada
 *        schema:
 *          $ref: "#/definitions/Error"
*/
router.put('/:id', permissions.operator, updateScheduledEnventController);

/**
 * @swagger
 * /scheduled-events:
 *   delete:
 *    tags: [ScehduledEvents]
 *    summary: Elimina evento programado
 *    description: Permite eleiminar un evento programdo
 *    consumes:
 *      - "application/json"
 *    produces:
 *      - "application/json"
 *    parameters:
 *      - name: id
 *        in: path
 *        type: string
 *        format: uuid/v4
 *        required: true
 *        description: Id del evento programado
 *    responses:
 *      204:
 *        description: Operación exitosa
 *      404:
 *        description: Evento no existe
 *        schema:
 *          $ref: "#/definitions/Error"
 *      401:
 *        description: Credenciales inválidos o cuenta deshabilitada
 *        schema:
 *          $ref: "#/definitions/Error"
*/
router.delete('/:id', permissions.operator, deleteScheduledEventController);

export default router;
