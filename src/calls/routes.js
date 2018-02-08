import {Router} from 'express';
import {callController, hangupController, webhookController} from './controllers';

const callRouter = Router();
const webhookRouter = Router();

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
 *         schema:
 *           $ref: "#/definitions/ContactValue"
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
callRouter.post('/owner/:id', callController);

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
callRouter.post('/hangup/:callId', hangupController);

webhookRouter.post('/', webhookController);
webhookRouter.put('/', webhookController);
webhookRouter.get('/', webhookController);
webhookRouter.options('/', webhookController);
webhookRouter.patch('/', webhookController);

export default {callRouter, webhookRouter};
