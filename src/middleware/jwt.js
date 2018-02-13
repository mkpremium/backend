import debug from 'debug';
import jwtMiddleware from 'express-jwt';
import jwtPermissions from 'express-jwt-permissions';
import _get from 'lodash/get';
import {jwt} from '../../config';

const jwtDebug = debug('app:jwt');

/**
 * @swagger
 * securityDefinitions:
 *   manager:
 *     name: Authorization
 *     type: apiKey
 *     in: header
 *   admin:
 *     name: Authorization
 *     type: apiKey
 *     in: header
 *   operator:
 *     name: Authorization
 *     type: apiKey
 *     in: header
 */

export default () => {
  jwtDebug('initialized JWT');
  return jwtMiddleware(Object.assign({}, jwt, {getToken}));
};

function getToken(req) {
  const authorization = _get(req, 'headers.authorization', '');
  const [scheme, credentials] = authorization.split(' ');
  if (scheme && /^Bearer$/i.test(scheme)) {
    return credentials;
  } else if (credentials) {
    return credentials;
  } else {
    return null;
  }
}

const guard = jwtPermissions();

export const permissions = {
  admin: guard.check('ADMIN'),
  operator: guard.check('OPERATOR'),
  manager: guard.check('MANAGER')
};
