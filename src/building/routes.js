import { Router } from 'express'
import {
  addMetadataToBuildingController,
  addOwnerToBuildingController,
  createAddNegotiationProposalController,
  createListBuildingProposalsController,
  createListBuildingsController,
  createListVerifiedOwnersController,
  createMetadataUploadUrlController,
  createUpdateBuildingNegotiationStatusController,
  updateNegotiationProposalController
} from './controllers'

export const createBuildingRoutes = (
  listBuildingsService,
  listBuildingProposalsService,
  legacyOwnerRepository,
  updateBuildingNegotiationStatusService,
  legacyBuildingRepository
) => {
  const router = Router()
  /**
   * @swagger
   * tags:
   *   name: Building
   *   description: Edificios
   */

  /**
   * @swagger
   * definitions:
   *   CreateUrlResponse:
   *     properties:
   *       url:
   *         type: string
   *         description: Url PUT de subida de amazon s3
   * /buildings/create-url:
   *   post:
   *     description: Genera una url de subida de amazon S3
   *     security:
   *       - admin: []
   *       - operator: []
   *       - manager: []
   *       - comercial: []
   *     tags: [Building, Operator]
   *     consumes:
   *       - "application/json"
   *     produces:
   *      - "application/json"
   *     parameters:
   *      - name: body
   *        in: body
   *        required: true
   *        schema:
   *          $ref: "#/definitions/SignedUrlRequest"
   *     responses:
   *       200:
   *         description: url generada
   *         schema:
   *           $ref: "#/definitions/CreateUrlResponse"
   *       400:
   *         description: solicitud invalida
   *         schema:
   *           $ref: "#/definitions/Error"
   *
   */
  router.post('/create-url', createMetadataUploadUrlController)

  /**
   * @swagger
   * definitions:
   *   CreateUrlResponse:
   *     properties:
   *       url:
   *         type: string
   *         description: Url PUT de subida de amazon s3
   * /buildings/{buildingId}/metadata:
   *   post:
   *     security:
   *       - admin: []
   *       - operator: []
   *       - manager: []
   *       - comercial: []
   *     tags: [Building, Operator]
   *     consumes:
   *       - "application/json"
   *     produces:
   *      - "application/json"
   *     parameters:
   *      - name: buildingId
   *        in: path
   *        type: string
   *        format: uuid/v4
   *        description: Id del edificio
   *      - name: body
   *        in: body
   *        required: true
   *        schema:
   *          $ref: "#/definitions/BuildingMetadataBody"
   *     responses:
   *       200:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/BuildingMetadata"
   *       400:
   *         description: Solicitud incorrecta
   *         schema:
   *           $ref: "#/definitions/Error"
   *
   */
  router.post('/:id/metadata', addMetadataToBuildingController)

  /**
   * @swagger
   * tags:
   *   name: Negotiation
   *   description: Negociaciones
   * /buildings/{buildingId}/negotiation:
   *   post:
   *     summary: Crea una nueva negociación
   *     tags: [Negotiation, Comercial, Building]
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
   *           $ref: "#/definitions/BuildingProposalBody"
   *       - name: buildingId
   *         in: path
   *         type: string
   *     responses:
   *       201:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/BuildingProposal"
   *       400:
   *         description: Solicitud incorrecta
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.post('/:id/negotiation', createAddNegotiationProposalController(legacyBuildingRepository, updateBuildingNegotiationStatusService))

  router.get('/:buildingId/proposals', createListBuildingProposalsController(listBuildingProposalsService))

  /**
   * @swagger
   * tags:
   *   name: Negotiation
   *   description: Negociaciones
   * /buildings/{buildingId}/negotiation/{negotiationId}:
   *   put:
   *     summary: Crea una nueva negociación
   *     tags: [Negotiation, Comercial, Building]
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
   *           $ref: "#/definitions/BuildingProposalBody"
   *       - name: buildingId
   *         in: path
   *         type: string
   *       - name: negotiationId
   *         in: path
   *         type: string
   *     responses:
   *       201:
   *         description: Operación exitosa
   *         schema:
   *           $ref: "#/definitions/BuildingProposal"
   *       400:
   *         description: Solicitud incorrecta
   *         schema:
   *           $ref: "#/definitions/Error"
   *       401:
   *         description: Credenciales inválidos o cuenta deshabilitada
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.put('/:building_id/negotiation/:id', updateNegotiationProposalController)

  /**
   * @swagger
   * /buildings/{id}/owners:
   *   post:
   *     summary: Crea un nuevo propietario relacionado a la hoja de trabajo
   *     tags: [Building, Manager, Operator, Business]
   *     security:
   *       - operator: []
   *       - manager: []
   *       - business: []
   *       - admin: []
   *     consumes:
   *       - "application/json"
   *     produces:
   *       - "application/json"
   *     parameters:
   *       - name: id
   *         in: path
   *         description: Id del edificio
   *         required: true
   *         type: string
   *         format: uuid/v4
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
   *       404:
   *         description: Edificio no encontrado
   *         schema:
   *           $ref: "#/definitions/Error"
   */
  router.post('/:id/owners', addOwnerToBuildingController)

  router.get('/:buildingId/owners', createListVerifiedOwnersController(legacyOwnerRepository))
  router.get('/:buildingId/verified-owners', createListVerifiedOwnersController(legacyOwnerRepository))

  router.get('/', createListBuildingsController(listBuildingsService))
  router.put(
    '/:buildingId/negotiation-status',
    createUpdateBuildingNegotiationStatusController(updateBuildingNegotiationStatusService)
  )

  return router
}
