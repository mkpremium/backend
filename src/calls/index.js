import {callRouter} from './routes';
import jwt from '../middleware/jwt';

import './types';

export default (app) => {
  const secured = jwt();
  app.use('/calls', secured, callRouter);
};
