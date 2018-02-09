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
 *   description: Gestion de usuarios del sistema
 */

/**
 * @swagger
 * /operator:
 *   post:
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: ["ADMIN"]
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
 */
router.post('/', createOperatorController);

export default router;
