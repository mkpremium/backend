import {Router} from 'express';
import {
  overAllController, overProvincesController,
  ownerBusinessStatsController,
  ownerStatsController,
  performanceController, worksheetStatsController
} from './controller';
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
 *     summary: "Obtiene las estadísticas diarias y totales por operator"
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
 *         description: rangos de fecha pre establecidos, cuando esta presente se omite el parametro dateBetween
 *       - name: role
 *         in: query
 *         type: string
 *         enum: [OPERATOR, BUSINESS]
 *       - name: view
 *         in: query
 *         type: string
 *         enum: [total, day]
 *       - name: dateBetween
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD,YYYY-MM-DD
 *         description: rangos de fecha personalizado (YYYY-MM-DD,YYYY-MM-DD)
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
router.get('/', permissions.manager, overAllController);

/**
 * @swagger
 * /stats/cities:
 *   get:
 *     tags: [Stats, Manager]
 *     summary: "Obtiene las estadísticas diarias y totales por ciudad"
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
 *         description: rangos de fecha pre establecidos, cuando esta presente se omite el parametro dateBetween
 *       - name: city
 *         in: query
 *         type: string
 *       - name: view
 *         in: query
 *         type: string
 *         enum: [total, day]
 *       - name: dateBetween
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD,YYYY-MM-DD
 *         description: rangos de fecha personalizado (YYYY-MM-DD,YYYY-MM-DD)
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
router.get('/cities', permissions.manager, overProvincesController);

/**
 * @swagger
 * /stats/performance:
 *   get:
 *     tags: [Stats, Manager]
 *     summary: "Obtiene el performance por operador"
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
 *         description: rangos de fecha pre establecidos, cuando esta presente se omite el parametro dateBetween
 *       - name: operatorId
 *         in: query
 *         type: string
 *         description: filtra un solo operador
 *       - name: dateBetween
 *         in: query
 *         type: string
 *         format: YYYY-MM-DD,YYYY-MM-DD
 *         description: rangos de fecha personalizado (YYYY-MM-DD,YYYY-MM-DD)
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
router.get('/performance', permissions.manager, performanceController);

/**
 * @swagger
 * /stats/owner:
 *   get:
 *     tags: [Stats, Manager]
 *     summary: "Obtiene estadisticas de los owner actuales"
 *     security:
 *       - manager: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: city
 *         in: query
 *         type: string
 *         description: Nombre de la ciudad
 *     responses:
 *       200:
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
router.get('/owner', permissions.manager, ownerStatsController);

/**
 * @swagger
 * /stats/worksheets:
 *   get:
 *     tags: [Stats, Manager]
 *     summary: "Obtiene estadisticas de las worksheets actuales"
 *     security:
 *       - manager: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     responses:
 *       200:
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
router.get('/worksheets', permissions.manager, worksheetStatsController);

/**
 * @swagger
 * /stats/owner-business:
 *   get:
 *     tags: [Stats, Manager]
 *     summary: "Obtiene estadisticas de los owner actuales comerciales"
 *     security:
 *       - manager: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     responses:
 *       200:
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
router.get('/owner-business', permissions.manager, ownerBusinessStatsController);

export default router;
