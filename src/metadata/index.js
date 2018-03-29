import routes from './routes';
import jwt from '../middleware/jwt';

export default (app) => {
  const secured = jwt();
  app.use('/metadata', secured, routes);
};
