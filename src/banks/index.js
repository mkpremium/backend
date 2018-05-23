import routes from './routes';
import jwt from '../middleware/jwt';
import swagger from './swagger';

export default (app) => {
  const secured = jwt();
  app.use('/banks', secured, routes);

  /**
   * @swagger
   * securityDefinitions:
   *   banks_api:
   *     name: Authorization
   *     type: apiKey
   *     in: header
   *     description:
   *      Si cuenta con un token previamente obtenido péguelo aquí
   *   banks:
   *     type: oauth2
   *     flow: password
   *     tokenUrl: /operators/login
   *     description:
   *      solamente llene los campos username y password. Los campos type, client_id,
   *      client_secret déjelos como están. Llamara directamente
   *      al endpoint de inicio de sesión y guardara el token por usted
   */

  swagger(app);
};
