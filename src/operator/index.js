import routes from './routes';

import './types';
import jwt from '../middleware/jwt';

export default (app) => {
  const secured = jwt().unless({
    path: [
      '/operators/login',
      '/operators/refresh-token'
    ]
  });

  app.use('/operators', secured, routes);
};
