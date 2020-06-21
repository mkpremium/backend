import { Router } from 'express'
import {
  addOwnerContactController,
  createSetFeaturedContactController,
  listOwnerController,
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

export default (setOwnerFeaturedContactService) => {
  router.put('/:ownerId/featured-contact', createSetFeaturedContactController(setOwnerFeaturedContactService))

  return router
}
