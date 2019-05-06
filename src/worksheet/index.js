import routes from './routes';
import buildingRoutes from './building/routes';

import './types';
import jwt from '../middleware/jwt';

export default (app) => {
  const secured = jwt();

  app.use('/worksheets', secured, routes);
  app.use('/worksheets/buildings', secured, buildingRoutes);
};
