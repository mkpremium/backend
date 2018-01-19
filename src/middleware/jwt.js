import jwtMiddleware from 'express-jwt';
import {jwt} from '../../config';

export default () => {
  return jwtMiddleware(jwt).unless({
    path: [
      '/operator/login',
      '/webhooks/numintec'
    ]
  });
};
