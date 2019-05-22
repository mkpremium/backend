import {Router} from 'express';
import {
  getOperatorRestringedHoursController,
  writeAnotherOperatorRestringedHoursController,
  writeOperatorRestringedHoursController
} from './controllers';

const router = Router({});

/**
 * @swagger
 * /operators/restringed-hours:
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
 * /operators/restringed-hours:
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

/**
 * @swagger
 * /operators/restringed-hours/:id:
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
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/RestringedHoursResponse"
 */
router.put('/:id', writeAnotherOperatorRestringedHoursController);

export default router;
