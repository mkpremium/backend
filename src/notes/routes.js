import { Router } from 'express'
import { addNoteController, listNotesController } from './controllers'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Note
 *   description: Notas
 */

/**
 * @swagger
 * /notes:
 *   get:
 *     tags: [Note, Operator, Comercial]
 *     security:
 *       - operator: []
 *       - admin: []
 *       - manager: []
 *       - comercial: []
 *     summary: Obtiene el listado de notas
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
 *       - name: offset
 *         in: query
 *         type: number
 *         description: Numero de registros a saltar
 *         default: 0
 *       - name: createdBy
 *         in: query
 *         type: string
 *         description: Id del operador que creo la nota
 *       - name: context
 *         in: query
 *         type: string
 *         description: JSON object con el contexto
 *       - name: createdAt
 *         in: query
 *         type: string
 *         format: dd-mm-YYYY
 *       - name: createdBetween
 *         in: query
 *         type: array
 *         items:
 *           type: string
 *           format: dd-mm-YYYY
 *     responses:
 *       200:
 *         description: Lista de notas
 *         schema:
 *           $ref: "#/definitions/NoteListResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/', listNotesController)

/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Crea una nueva nota
 *     tags: [Note, Operator, Comercial]
 *     security:
 *       - operator: []
 *       - manager: []
 *       - admin: []
 *       - comercial: []
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: "#/definitions/NoteBody"
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
 */
router.post('/', addNoteController)

export default router
