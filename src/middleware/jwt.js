import debug from 'debug';
import jwtMiddleware from 'express-jwt';
import {jwt} from '../../config';

const jwtDebug = debug('app:jwt');

export default () => {
  jwtDebug('initialized JWT');
  return jwtMiddleware(jwt).unless({
    path: [
      /\/migration/,
      '/operator/login',
      '/webhooks/numintec'
    ]
  });
};
