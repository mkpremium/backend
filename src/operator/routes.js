import {Router} from 'express';
import {createOperatorController, listOperatorController, loginController} from './controllers';
import {permissions} from '../middleware/jwt';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Operator
 *   description: Usuario del sistema
 */

/**
 * @swagger
 * /operators/login:
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
 *         description: Autenticado exitosamente
 *         schema:
 *           $ref: "#/definitions/AuthenticatedResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/login', loginController);

/**
 * @swagger
 * tags:
 *   name: Manager
 *   description: Gestión de usuarios del sistema
 */

/**
 * @swagger
 * /operators:
 *   post:
 *     tags: [Manager]
 *     summary: Crear operador
 *     security:
 *       - manager: []
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
 *       201:
 *         description: Operador creado
 *         schema:
 *           $ref: "#/definitions/Operator"
 *       400:
 *         description: Solicitud invalida
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/', permissions.admin, createOperatorController);

router.get('/', permissions.admin, listOperatorController);

export default router;
