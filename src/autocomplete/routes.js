import { Router } from 'express'
import { suggestionController } from './controllers'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Autocomplete
 *   description: Sugerencias de auto completado
 * definitions:
 *   Autocomplete:
 *     properties:
 *       value:
 *         type: string
 *
 * /suggestions/{field}:
 *   get:
 *     description: Devuelve resultados sobre el indica de personas usa los campos name, document, contacts.contact
 *     tags: [Autocomplete]
 *     security:
 *       - operator: []
 *       - admin: []
 *       - manager: []
 *       - comercial: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: field
 *         in: path
 *         type: string
 *         description: "Tipo de sugerencia"
 *         enum: [zone, province, city, neighborhood]
 *         required: true
 *       - name: query
 *         in: query
 *         type: string
 *         description: "parámetro de búsqueda (ej: maria, mari*)"
 *     responses:
 *       200:
 *         description: resultado de sugerencias
 *         schema:
 *           $ref: "#/definitions/Autocomplete"
 */
router.get('/:field', suggestionController)

export default router
