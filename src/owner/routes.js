import { Router } from 'express'
import {
  addOwnerContactController,
  addOwnerController,
  listOwnerController,
  updateBusinessStatusController,
  updateOwnerContactController,
  updateOwnerController
} from './controllers'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Owner
 *   description: Propietarios
 */

/**
 * @swagger
 * /owners:
 *   post:
 *     summary: Crea un nuevo propietario
 *     tags: [Owner, Manager, Operator]
 *     security:
 *       - operator: []
 *       - manager: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/OwnerBody"
 *     responses:
 *       201:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/Owner"
 *       400:
 *         description: Solicitud incorrecta
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
router.post('/', addOwnerController)

/**
 * @swagger
 * /owners/{id}:
 *   put:
 *     summary: Actualiza un propietario
 *     tags: [Owner, Operator]
 *     security:
 *       - operator: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         format: uuid/v4
 *         description: Id del propietario
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/OwnerUpdate"
 *     responses:
 *       204:
 *         description: Operación exitosa
 *       404:
 *         description: Propietario no existe
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.put('/:id', updateOwnerController)

/**
 * @swagger
 * /owners/{id}/business-status:
 *   put:
 *     summary: Actualiza el estado de la negociación para un owner
 *     tags: [Owner, Operator, Comercial]
 *     security:
 *       - operator: []
 *       - admin: []
 *       - business: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         format: uuid/v4
 *         description: Id del propietario
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/OwnerUpdateBusinessStatus"
 *     responses:
 *       204:
 *         description: Operación exitosa
 *       404:
 *         description: Propietario no existe
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.put('/:id/business-status', updateBusinessStatusController)

/**
 * @swagger
 * /owners/{id}/contacts/{contactId}:
 *   put:
 *     tags: [Owner, Operator]
 *     summary: Actualiza un contacto de un propietario
 *     security:
 *       - operator: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         format: uuid/v4
 *         description: Id del propietario
 *       - name: contactId
 *         in: path
 *         type: string
 *         format: uuid/v4
 *         description: Id del contacto de propietario
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/TypedContactInfoUpdate"
 *     responses:
 *       200:
 *         description: "Operación exitosa"
 *         schema:
 *           $ref: "#/definitions/Owner"
 *       404:
 *         description: Propietario no existe
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.put('/:id/contacts/:contactId', updateOwnerContactController)

/**
 * @swagger
 * /owners/{id}/contacts:
 *   post:
 *     tags: [Owner, Operator]
 *     summary: Agrega un contacto a un propietario
 *     security:
 *       - operator: []
 *       - admin: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         format: uuid/v4
 *         description: Id del propietario
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/TypedContactInfoBody"
 *     responses:
 *       204:
 *         description: Operación exitosa
 *       404:
 *         description: Propietario no existe
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/:id/contacts', addOwnerContactController)

/**
 * @swagger
 * /owners:
 *   get:
 *     tags: [Owner, Manager, Operator, Business]
 *     summary: Obtiene el listado de owners
 *     security:
 *       - manager: []
 *       - operator: []
 *       - business: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *         description: Cantidad máxima a de registros a recibir
 *         default: 20
 *       - name: contactNumber
 *         in: query
 *         type: string
 *         description: Numero de contacto - requerido.
 *     responses:
 *       200:
 *         description: Lista de owners
 *         schema:
 *           $ref: "#/definitions/OwnerLitResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/', listOwnerController)

export default router
