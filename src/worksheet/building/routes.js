import { Router } from 'express'
import { createBuildingController } from './controllers'

const router = Router()

/**
 * @swagger
 * /worksheets/buildings:
 *   post:
 *     summary: Crea un nuevo edificio y su worksheet inicialmente en estado invalido
 *     tags: [Worksheet, Operator, Building]
 *     security:
 *      - operator: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/CreateBuildingInput"
 *     responses:
 *       201:
 *         description: Operación exitosa
 *         schema:
 *           $ref: "#/definitions/Worksheet"
 *       400:
 *         description: Solicitud incorrecta
 *         schema:
 *           $ref: "#/definitions/Error"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.post('/', createBuildingController)

export default router
