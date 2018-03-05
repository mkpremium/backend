import {Router} from 'express';
import {
  callController,
  hangupController,
  webhookController,
  addNoteController
} from './controllers';
import {permissions} from '../middleware/jwt';

const call = Router();
const webhook = Router();
/**
 * @swagger
 * tags:
 *   name: Calls
 *   description: Llamadas
 */

/**
 * @swagger
 * /calls/owner/{id}:
 *   post:
 *     tags: [Calls, Operator]
 *     summary: Iniciar llamada
 *     consumes:
 *       - "application/json"
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: id
 *        in: path
 *        type: string
 *        format: uuid/v4
 *        description: Id del propietario a llamar
 *      - name: body
 *        in: body
 *        schema:
 *          $ref: "#/definitions/ContactValue"
 *     responses:
 *       200:
 *         description: Peticion de llamada exitosa
 *         schema:
 *           $ref: "#/definitions/Calls"
 *       400:
 *         description: Error en la peticion de llamada
 *         schema:
 *           $ref: "#/definitions/CallErrorResponse"
 */
call.post('/owner/:id', permissions.operator, callController);

/**
 * @swagger
 * /calls/hangup/{callId}:
 *   post:
 *     tags: [Calls]
 *     summary: Colgar llamada
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: callId
 *        in: path
 *        type: string
 *        description: Id de la llamada registrada
 *     responses:
 *       204:
 *         description: Peticion exitosa de fin de llamada
 *         schema:
 *           $ref: "#/definitions/HangupSuccessResponse"
 *       400:
 *         description: Error en la peticion de fin de llamada
 *         schema:
 *           $ref: "#/definitions/CallErrorResponse"
 */
call.post('/hangup/:callId', permissions.operator, hangupController);

/**
 * @swagger
 * /calls/note/{callId}:
 *   post:
 *     tags: [Calls]
 *     summary: Agrega/Actualiza nota en llamada existente
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: callId
 *        in: path
 *        type: string
 *        description: Id de la llamada registrada
 *      - name: body
 *        in: body
 *        schema:
 *          $ref: "#/definitions/AddCallNote"
 *     responses:
 *       204:
 *         description: Peticion exitosa
 *       400:
 *         description: Error en la peticion
 */
call.post('/note/:callId', permissions.operator, addNoteController);

webhook.post('/', webhookController);

export const callRouter = call;
export const webhookCallsRouter = webhook;
