import './types';
import routes from './routes';
import jwt, {permissions} from '../middleware/jwt';

export default (app) => {
  const secured = jwt();
  app.use('/system-preferences', secured, permissions.admin, routes);
};
