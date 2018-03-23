import {Router} from 'express';
import {createOperatorController, listOperatorController, loginController, meController} from './controllers';
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
 *     tags: [Admin]
 *     summary: Crear operador
 *     security:
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/OperatorBody"
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

/**
 * @swagger
 * /operators:
 *   get:
 *     tags: [Admin]
 *     summary: Obtiene el listado de operadores
 *     security:
 *       - admin: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *         description: Cantidad máxima a de registros a recibir
 *         default: 20
 *       - name: offset
 *         in: query
 *         type: number
 *         description: Numero de registros a saltar
 *         default: 0
 *       - name: role
 *         in: query
 *         type: string
 *         description: Rol del operador
 *     responses:
 *       200:
 *         description: Lista de hojas de trabajo
 *         schema:
 *           $ref: "#/definitions/OperatorListResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/', listOperatorController);

/**
 * @swagger
 * /operators/me:
 *   get:
 *     security:
 *       - admin: []
 *       - manager: []
 *       - operator: []
 *     tags: [Operator]
 *     summary: Obtiene información acerca del operador actual
 *     responses:
 *       200:
 *         description: Solicitud exitosa
 *         schema:
 *           $ref: "#/definitions/Operator"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/me', meController);

export default router;
