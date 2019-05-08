import {Router} from 'express';
import {
  getCitiesController,
  getCompleteInfoController,
  getProvincesController,
  getStreetsController
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
 *     parameters:
 *      - name: province
 *        required: true
 *        type: string
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
 *     parameters:
 *      - name: province
 *        description: Nombre de la provincia
 *        required: true
 *        type: string
 *      - name: city
 *        description: Nombre del municipio
 *        required: true
 *        type: string
 */
router.get('/streets', getStreetsController);

/**
 * @swagger
 * /cadastre/complete-info:
 *   post:
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
 *     parameters:
 *      - name: body
 *        id: body
 *        required: true
 */
router.post('/complete-info', getCompleteInfoController);

export default router;
