import {Router} from 'express';
import {downloadMetadataFileController} from './controllers';

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Metadata
 *   description: Archivos meta datos
 */

/**
 * @swagger
 * definitions:
 *   CreateUrlResponse:
 *     properties:
 *       url:
 *         type: string
 *         description: Url PUT de subida de amazon s3
 * /metadata/{metadataId}/download:
 *   get:
 *     description: Redirige a la url temporal de amazon s3 del meta dato indicado
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Metadata, Operator]
 *     parameters:
 *      - name: metadataId
 *        in: path
 *        type: string
 *        format: uuid/v4
 *        description: Id del archivo meta dato
 *     responses:
 *       302:
 *         description: Redirige a la url temporal de amazon s3
 *       404:
 *         description: Meta dato no encontrado
 *         schema:
 *           $ref: "#/definitions/Error"
 *
 */
router.get('/:id/download', downloadMetadataFileController);

export default router;
