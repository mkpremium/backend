import {Router} from 'express';
import {setProfitGoalToOperatorController} from './controllers';

const router = Router();

/**
 * @swagger
 * /operators/profit/goal:
 *   post:
 *     tags: [Stock]
 *     summary: Actualiza la meta de ganancia del operador
 *     security:
 *       - operator: []
 *       - admin: []
 *       - manager: []
 *       - comercial: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: profitAmount
 *         type: number
 *         in: body
 *         required: true
 *       - name: operatorId
 *         type: number
 *         in: body
 *         required: true
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/Stock"
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
router.post('/goal', setProfitGoalToOperatorController);

export default router;
