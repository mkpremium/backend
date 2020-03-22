import { Router } from 'express'
import {
  cancelSellStockController,
  closeSellStockController,
  createPurchaseStockController,
  sellPurchasedStockController,
  updatePurchaseStockController,
  updateSellStockController,
  getRankingController
} from './controllers'

export const addStockRoutes = (propertyManagerRankingService) => {
  const router = Router()

  /**
   * @swagger
   * tags:
   *   name: Stock
   *   description: Building stock
   */

  /**
   * @swagger
   * /stock/purchase:
   *   post:
   *     tags: [Stock]
   *     summary: Crea un stock con estado purchase
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
   *       - name: buildingId
   *         type: string
   *         in: body
   *         required: true
   *       - name: reservationAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: reservationDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *       - name: transactionAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: transactionDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/Stock"
   *       400:
   *         description: Solicitud mal formada
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.post('/purchase', createPurchaseStockController)

  /**
   * @swagger
   * /stock/purchase:
   *   put:
   *     tags: [Stock]
   *     summary: Actualiza un stock con estado purchase
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
   *       - name: buildingId
   *         type: string
   *         in: body
   *         required: true
   *       - name: reservationAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: reservationDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *       - name: transactionAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: transactionDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/Stock"
   *       400:
   *         description: Solicitud mal formada
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.put('/purchase', updatePurchaseStockController)

  /**
   * @swagger
   * /stock/sell:
   *   post:
   *     tags: [Stock]
   *     summary: Actualiza un stock en estado purchased a sell
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
   *       - name: buildingId
   *         type: string
   *         in: body
   *         required: true
   *       - name: reservationAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: reservationDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *       - name: transactionAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: transactionDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/Stock"
   *       400:
   *         description: Solicitud mal formada
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.post('/sell', sellPurchasedStockController)

  /**
   * @swagger
   * /stock/sell:
   *   put:
   *     tags: [Stock]
   *     summary: Actualiza los datos de sell en un stock
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
   *       - name: buildingId
   *         type: string
   *         in: body
   *         required: true
   *       - name: reservationAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: reservationDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *       - name: transactionAmount
   *         type: number
   *         in: body
   *         required: true
   *       - name: transactionDate
   *         type: string
   *         in: body
   *         format: YYYY-MM-DDTHH:mm:ss.sssZ
   *         required: true
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/Stock"
   *       400:
   *         description: Solicitud mal formada
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.put('/sell', updateSellStockController)

  /**
   * @swagger
   * /stock/sell/cancel:
   *   post:
   *     tags: [Stock]
   *     summary: Cancela un stock en sell status y lo revierte a un purchase status
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
   *       - name: buildingId
   *         type: string
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/Stock"
   *       400:
   *         description: Solicitud mal formada
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.post('/sell/cancel', cancelSellStockController)

  /**
   * @swagger
   * /stock/close:
   *   post:
   *     tags: [Stock]
   *     summary: Actualiza el estado de un stock a closed y calcula el valor de la ganancia
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
   *       - name: buildingId
   *         type: string
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/Stock"
   *       400:
   *         description: Solicitud mal formada
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   *
   */
  router.post('/close', closeSellStockController)

  /**
   * @swagger
   * /stock/ranking:
   *   get:
   *     tags: [Stock]
   *     summary: Obtiene el ranking de ganancias de los stock cerrados ordenados por usuario de mayor a menor
   *     security:
   *       - operator: []
   *       - admin: []
   *       - manager: []
   *       - comercial: []
   *     consumes:
   *       - "application/json"
   *     produces:
   *       - "application/json"
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/Stock"
   *       400:
   *         description: Solicitud mal formada
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   *
   */
  router.get('/ranking', getRankingController(propertyManagerRankingService))

  return router
}
