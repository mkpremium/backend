import {Router} from 'express';
import {
  getCitiesController,
  getBuildingByAddressController,
  getProvincesController,
  getStreetsController, getBuildingByCadastreController
} from './controllers';

const router = Router({});

/**
 * @swagger
 * /cadastre/provinces:
 *   get:
 *     description: Devuelve las provincias de españa
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Cadastre, Operator]
 *     consumes:
 *       - "application/json"
 *     produces:
 *      - "application/json"
 *     responses:
 *       200:
 *         description: Listado de provincias
 *         type: array
 *         items:
 *           $ref: "#/definitions/Province"
 * definitions:
 *   Province:
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 */
router.get('/provinces', getProvincesController);

/**
 * @swagger
 * /cadastre/cities:
 *   get:
 *     description: Devuelve las municipios de la provincia indicada
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Cadastre, Operator]
 *     consumes:
 *       - "application/json"
 *     produces:
 *      - "application/json"
 *     responses:
 *       200:
 *         description: Listado de municipios
 *         type: array
 *         items:
 *           $ref: "#/definitions/City"
 *     parameters:
 *      - name: province
 *        in: query
 *        required: true
 *        type: string
 * definitions:
 *   City:
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 */
router.get('/cities', getCitiesController);

/**
 * @swagger
 * /cadastre/streets:
 *   get:
 *     description: Devuelve las calles del municipio y provincia pasados
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Cadastre, Operator]
 *     consumes:
 *       - "application/json"
 *     produces:
 *      - "application/json"
 *     responses:
 *       200:
 *         description: Listado de calles
 *         type: array
 *         items:
 *           $ref: "#/definitions/Street"
 *     parameters:
 *      - name: province
 *        in: query
 *        description: Nombre de la provincia
 *        required: true
 *        type: string
 *      - name: city
 *        in: query
 *        description: Nombre del municipio
 *        required: true
 *        type: string
 * definitions:
 *   Street:
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 *       type:
 *         type: string
 */
router.get('/streets', getStreetsController);

/**
 * @swagger
 * /cadastre/complete-info:
 *   post:
 *     description: "**Use el endpoint \/cadastre\/building-by-address este dejara de estar disponible**"
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Cadastre, Operator]
 *     consumes:
 *       - "application/json"
 *     produces:
 *      - "application/json"
 *     responses:
 *       200:
 *         description: Información de edificio
 *         schema:
 *           $ref: "#/definitions/Building"
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/CadastreAddressInput"
 */
router.post('/complete-info', getBuildingByAddressController);

/**
 * @swagger
 * /cadastre/building-by-address:
 *   post:
 *     description: Devuelve location y address formateado para una dirección pasada
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Cadastre, Operator]
 *     consumes:
 *       - "application/json"
 *     produces:
 *      - "application/json"
 *     responses:
 *       200:
 *         description: Información de edificio
 *         schema:
 *           $ref: "#/definitions/Building"
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/CadastreAddressInput"
 */
router.post('/building-by-address', getBuildingByAddressController);

/**
 * @swagger
 * /cadastre/building-by-cadastre:
 *   post:
 *     description: Devuelve location y address formateado para una referencia catastral pasada
 *     security:
 *       - admin: []
 *       - operator: []
 *       - manager: []
 *       - comercial: []
 *     tags: [Cadastre, Operator]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     responses:
 *       200:
 *         description: Información de edificio
 *         schema:
 *           $ref: "#/definitions/Building"
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/CadastreReferenceInput"
 */
router.post('/building-by-cadastre', getBuildingByCadastreController);

export default router;
