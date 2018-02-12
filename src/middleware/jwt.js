import debug from 'debug';
import jwtMiddleware from 'express-jwt';
import jwtPermissions from 'express-jwt-permissions';
import {jwt} from '../../config';

const jwtDebug = debug('app:jwt');

export default () => {
  jwtDebug('initialized JWT');
  return jwtMiddleware(jwt);
};

const guard = jwtPermissions();

export const permissions = {
  admin: guard.check('ADMIN'),
  operator: guard.check('OPERATOR')
};
