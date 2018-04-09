import {Router} from 'express';
import {searchPeopleController} from './controllers';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: People
 *   description: Personas
 * definitions:
 *   SearchResponse:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *         description: id del registro originalmente indexado
 *       score:
 *         type: number
 *         description: Puntaje obtenido de la query (los resultados con mayor puntaje van primero)
 *       locations:
 *         type: object
 *         description: Información para resaltar los campos
 *       fields:
 *         type: object
 *         description: Información almacenada en el indice (campos usados para buscar)
 *
 * /people/search:
 *   get:
 *     description: Devuelve resultados sobre el indica de personas usa los campos name, document, contacts.contact
 *     tags: [Operator, People]
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
 *       - name: query
 *         in: query
 *         type: string
 *         description: "parámetro de búsqueda (ej: maria, mari*)"
 *     responses:
 *       200:
 *         description: Lista de notas
 *         schema:
 *           $ref: "#/definitions/SearchResponse"
 */
router.get('/search', searchPeopleController);

export default router;
