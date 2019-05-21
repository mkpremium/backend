import {Router} from 'express';
import {getOperatorRestringedHoursController, writeOperatorRestringedHoursController} from './controllers';

const router = Router({});

/**
 * @swagger
 * /operator/restringed-hours:
 *   get:
 *     description: Regresa el listado de horas restringidas para este usuario
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Operator, Business, RestringedHours]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     responses:
 *       200:
 *         description: Información de las horas restringidas
 *         schema:
 *           $ref: "#/definitions/RestringedHoursResponse"
 */
router.get('/', getOperatorRestringedHoursController);

/**
 * @swagger
 * /operator/restringed-hours:
 *   put:
 *     description: Regresa el listado de horas restringidas para este usuario
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Operator, Business, RestringedHours]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     responses:
 *       204:
 *         description: Información de las horas restringidas
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/RestringedHoursResponse"
 */
router.put('/', writeOperatorRestringedHoursController);

export default router;
