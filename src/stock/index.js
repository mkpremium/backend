import routes from './routes.js';
import './types';
import jwt from '../middleware/jwt';

export default (app) => {
  const secured = jwt();
  app.use('/stock', secured, routes);
};
