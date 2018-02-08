import {Router} from 'express';
import {updateOwnerContactStatusController} from './controllers';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Owner
 *   description: Propietarios
 */

/**
 * @swagger
 * /owners/{id}/contacts:
 *   put:
 *     tags: [Owner, Operator]
 *     summary: Actualiza un owner determinado
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
 *         schema:
 *           $ref: "#/definitions/Error"
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

export default router;
