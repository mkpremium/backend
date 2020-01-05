import { Router } from 'express'
import {
  createOperatorController,
  limitedListOperatorController,
  listOperatorController,
  loginController,
  meController,
  refreshTokenController,
  updateOperatorController
} from './controllers'
import { permissions } from '../middleware/jwt'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Operator
 *   description: Usuario del sistema
 */

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Cuentas de usuario
 */

/**
 * @swagger
 * /operators/login:
 *   post:
 *     tags: [Operator, Account]
 *     summary: Iniciar sesión
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
router.post('/login', loginController)

/**
 * @swagger
 * definitions:
 *   AppRefreshToken:
 *     properties:
 *      appToken:
 *        type: string
 * /operators/refresh-token:
 *   post:
 *     tags: [Operator, Account]
 *     summary: Refrescar token
 *     security:
 *       - operator: []
 *       - admin: []
 *       - manager: []
 *       - business: []
 *       - street: []
 *       - street_manager: []
 *     consumes:
 *      - "application/json"
 *     produces:
 *      - "application/json"
 *     parameters:
 *      - name: body
 *        in: body
 *        required: false
 *        schema:
 *          $ref: "#/definitions/AppRefreshToken"
 *     responses:
 *       200:
 *         description: Autenticado exitosamente
 *         schema:
 *           $ref: "#/definitions/AuthenticatedResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       404:
 *         description: Operator inexistente
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/refresh-token', refreshTokenController)

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
 *       - manager: []
 *       - street_manager: []
 *       - street_admin: []
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
router.post('/', permissions.allManagers, createOperatorController)

/**
 * @swagger
 * /operators/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Actualiza un operador
 *     security:
 *       - admin: []
 *       - manager: []
 *       - street_manager: []
 *       - street_admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/OperatorBody"
 *     responses:
 *       204:
 *         description: Operación exitosa
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
router.put('/:id', permissions.allManagers, updateOperatorController)

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
 *         description: Lista de operadores
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
router.get('/', permissions.admin, listOperatorController)

/**
 * @swagger
 * /operators/business:
 *   get:
 *     tags: [Operator]
 *     summary: Obtiene el listado de comerciales
 *     security:
 *       - operator: []
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
 *     responses:
 *       200:
 *         description: Lista de comerciales
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
router.get('/business', limitedListOperatorController)

/**
 * @swagger
 * /operators/me:
 *   get:
 *     security:
 *       - admin: []
 *       - manager: []
 *       - operator: []
 *       - banks_api: []
 *       - banks: []
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
router.get('/me', meController)

export default router
