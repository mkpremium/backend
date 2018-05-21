import routes from './routes';
import jwt from '../middleware/jwt';
import swagger from './swagger';

export default (app) => {
  const secured = jwt();
  app.use('/banks', secured, routes);

  /**
   * @swagger
   * securityDefinitions:
   *   banks:
   *     type: oauth2
   *     flow: password
   *     tokenUrl: /operators/login
   */

  swagger(app);
};
