import {Router} from 'express';
import {
  addOwnerContactController, addOwnerController, updateOwnerContactStatusController,
  updateOwnerController
} from './controllers';
import {permissions} from '../middleware/jwt';

const router = Router();

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
 *     tags: [Owner, Manager]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/Owner"
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
router.post('/', permissions.manager, addOwnerController);

/**
 * @swagger
 * /owners/{id}:
 *   put:
 *     summary: Actualiza un propietario
 *     tags: [Owner, Operator]
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
router.put('/:id', updateOwnerController);

/**
 * @swagger
 * /owners/{id}/contacts:
 *   put:
 *     tags: [Owner, Operator]
 *     summary: Actualiza un contacto de un propietario
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
 *           $ref: "#/definitions/UpdateContactStatus"
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
router.put('/:id/contacts', updateOwnerContactStatusController);

/**
 * @swagger
 * /owners/{id}/contacts:
 *   post:
 *     tags: [Owner, Operator]
 *     summary: Agrega un contacto a un propietario
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
 *           $ref: "#/definitions/TypedContactInfo"
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
router.post('/:id/contacts', addOwnerContactController);

export default router;
