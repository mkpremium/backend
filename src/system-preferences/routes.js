import { Router } from 'express'
import { getSystemPreferencesController, writeSystemPreferencesController } from './controllers'

const router = Router({})

/**
 * @swagger
 * /system-preferences:
 *   get:
 *     description: Devuelve las preferencias del sistema
 *     security:
 *       - admin: []
 *     tags: [SystemPreferences, Admin]
 *     consumes:
 *       - "application/json"
 *     produces:
 *      - "application/json"
 *     responses:
 *       200:
 *         description: Listado de provincias
 *         schema:
 *           $ref: "#/definitions/SystemPreferences"
 */
router.get('/', getSystemPreferencesController)

/**
 * @swagger
 * /system-preferences:
 *   post:
 *     description: Escribe las preferencias del sistema
 *     security:
 *       - admin: []
 *     tags: [SystemPreferences, Admin]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/SystemPreferences"
 *     responses:
 *       204:
 *         description: Listado de provincias
 */
router.post('/', writeSystemPreferencesController)

export default router
