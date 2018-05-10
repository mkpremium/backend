import routes from './routes';

import './types';
import jwt from '../middleware/jwt';

export default (app) => {
  const secured = jwt();

  app.use('/email', secured, routes);
};
