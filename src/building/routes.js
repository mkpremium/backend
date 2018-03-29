import {Router} from 'express';
import {addMetadataToBuildingController, createMetadataUploadUrlController} from './controllers';

const router = Router();
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
 *         schema:
 *           $ref: "#/definitions/CreateUrlResponse"
 *       400:
 *         schema:
 *           $ref: "#/definitions/ErrorResponse"
 *
 */
router.post('/create-url', createMetadataUploadUrlController);

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
 *         schema:
 *           $ref: "#/definitions/BuildingMetadata"
 *       400:
 *         schema:
 *           $ref: "#/definitions/ErrorResponse"
 *
 */
router.post('/:id/metadata', addMetadataToBuildingController);

export default router;
