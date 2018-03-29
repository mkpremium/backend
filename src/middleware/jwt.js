import {compose} from 'compose-middleware';
import {wrap} from 'express-promise-wrap';
import jwtMiddleware from 'express-jwt';
import jwtPermissions from 'express-jwt-permissions';
import _get from 'lodash/get';
import {jwt} from '../../config';
import {OperatorRepository} from '../operator/models';

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
  const jwtInstance = jwtMiddleware(Object.assign({}, jwt, {getToken}));
  const composedJwt = compose(jwtInstance, wrap(addUserInfo));
  composedJwt.UnauthorizedError = jwtInstance.UnauthorizedError;
  composedJwt.unless = jwtInstance.unless;
  return composedJwt;
};

async function addUserInfo(req, res, next) {
  const id = req.user.id;
  const userRepo = new OperatorRepository();
  req.user.operator = await userRepo.findById(id);
  next();
}

function getToken(req) {
  const authorization = _get(req, 'headers.authorization', '');
  const [scheme, credentials] = authorization.split(' ');
  if (scheme && /^Bearer$/i.test(scheme)) {
    return credentials;
  } else if (scheme) {
    return scheme; // if it's a value the this is the credential
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
