import { Router } from 'express'
import { listHistoryController } from './controllers'
import { permissions } from '../middleware/jwt'

const router = Router()

/**
 * @swagger
 * /history:
 *   get:
 *     security:
 *       - admin: []
 *       - manager: []
 *       - operator: []
 *     tags: [History]
 *     summary: Obtiene listado de historial
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
 *       - name: actionType
 *         in: query
 *         type: string
 *         enum: [UPDATE, CREATE, GET, OPEN, LIST, RELEASE, TAKE, ERROR]
 *         description: Tipo de accion
 *       - name: modelName
 *         in: query
 *         type: string
 *         enum: [calls, worksheet, building]
 *         description: Nombre del modelo. (_documentType)
 *       - name: operatorId
 *         in: query
 *         type: string
 *       - name: createdAt
 *         in: query
 *         type: string
 *         description: Fecha de creación. (YYYY-MM-DD)
 *       - name: createdBetween
 *         in: query
 *         type: string
 *         description: Rango de fechas de creación. (YYYY-MM-DD,YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de historial
 *         schema:
 *           $ref: "#/definitions/HistoryListResponse"
 *       401:
 *         description: Credenciales inválidos o cuenta deshabilitada
 *         schema:
 *           $ref: "#/definitions/Error"
 *       403:
 *         description: Permisos insuficientes
 *         schema:
 *           $ref: "#/definitions/Error"
 */
router.get('/', permissions.operator, listHistoryController)

export default router
