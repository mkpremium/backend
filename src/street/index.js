import routes from './routes';

import './types';
import {jwtAppToken} from '../middleware/jwt';

export default (app) => {
  const secured = jwtAppToken();

  app.use('/', secured, routes);
};
