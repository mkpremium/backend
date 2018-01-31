import {Router} from 'express';
import {createOperatorController, loginController} from './controllers';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Operator
 *   description: Usuario del sistema
 */

/**
 * @swagger
 * definitions:
 *   AuthenticatedResponse:
 *     properties:
 *       token:
 *        type: string
 *        description: Bearer token
 *       operator_id:
 *        type: string
 *        format: uuid/v4
 *        description: Id de operador
 *       roles:
 *        type: array
 *        items:
 *          type: string
 *        description: Roles que el operador tiene acceso
 */

/**
 * @swagger
 * /operator/login:
 *   post:
 *     tags: [Operator]
 *     summary: Iniciar sesion
 *     consumes:
 *      - "application/json"
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: body
 *        in: body
 *        required: true
 *        schema:
 *          $ref: "#/definitions/Credentials"
 *     responses:
 *       200:
 *         description: Exito
 *         schema:
 *           $ref: "#/definitions/AuthenticatedResponse"
 *       401:
 *         description: Credenciales invalidos o cuenta deshabilitada
 */
router.post('/login', loginController);

/**
 * @swagger
 * tags:
 *   name: Manager
 *   description: Gestion de usuarios del sistema
 */

/**
 * @swagger
 * /operator:
 *   post:
 *     tags: [Manager]
 *     summary: Crear operador
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/Operator"
 *     responses:
 *       400:
 *         summary: Solicitud invalida
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/', createOperatorController);

export default router;
