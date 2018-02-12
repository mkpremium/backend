import routes from './routes';

import './types';
import jwt from '../middleware/jwt';

export default (app) => {
  const secured = jwt().unless({
    path: [
      '/operator/login'
    ]
  });

  app.use('/worksheets', secured, routes);
};
