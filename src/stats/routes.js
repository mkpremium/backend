import {Router} from 'express';
import {overAllController} from './controller';
import {permissions} from '../middleware/jwt';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: "Estadísticas"
 */

/**
 * @swagger
 * /stats:
 *   get:
 *     tags: [Stats, Manager]
 *     summary: "Obtiene las estadísticas diarias por operator"
 *     security:
 *       - manager: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: range
 *         in: query
 *         type: string
 *         enum: [today, yesterday, month, lastMonth, year, lastYear]
 *     responses:
 *       200:
 *         description: Estadísticas por operador
 *         schema:
 *           type: "array"
 *           items:
 *             $ref: "#/definitions/OperatorResults"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/', overAllController);

export default router;
