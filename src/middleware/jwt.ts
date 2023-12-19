import { compose } from 'compose-middleware'
import { wrap } from 'express-promise-wrap'
import jwtMiddleware from 'express-jwt'
import jwtPermissions from 'express-jwt-permissions'
import _get from 'lodash/get'
import { jwt as jwtConfig } from '../../config'
import { OperatorRepository } from '../operator/models'
import { UserRoles } from '../types/user'
import { logger } from '../infrastructure/logger'
import honeycomb from "honeycomb-beeline";

function jwtMiddlewareAdapter () {
  const jwtInstance: any = jwtMiddleware({ ...jwtConfig, bearerTokenExtractor, algorithms: [ 'HS256' ] })
  const composedJwt: any = compose(jwtInstance, wrap(addUserInfo))
  composedJwt.UnauthorizedError = jwtInstance.UnauthorizedError
  composedJwt.unless = jwtInstance.unless
  return composedJwt
}

export default jwtMiddlewareAdapter

async function addUserInfo (req, res, next) {
  logger.debug('jwt-middleware#addUserInfo', req.user.id)
  const id = req.user.id
  const userRepo = new OperatorRepository()

  return userRepo.findById(id)
    .then(user => {
      if (!user || !user.enable) {
        res.sendStatus(401)
        return
      }
      req.user.operator = user
      honeycomb().addContext({userId: user.id})
      next()
    })
}

export function bearerTokenExtractor (req) {
  const authorization = _get(req, 'headers.authorization', '')
  const [ scheme, credentials ] = authorization.split(' ')
  if (scheme && /^Bearer$/i.test(scheme)) {
    return credentials
  } else if (scheme) {
    return scheme // if it's a value the this is the credential
  } else {
    return appTokenExtractor(req)
  }
}

function appTokenExtractor (req) {
  return _get(req, 'body.appToken')
}

const guard = jwtPermissions()

export const permissions = {
  admin: guard.check(UserRoles.ADMIN),
  operator: guard.check([
    [ UserRoles.ADMIN ],
    [ UserRoles.MANAGER ],
    [ UserRoles.OPERATOR ]
  ]),
  manager: guard.check([
    [ UserRoles.ADMIN ],
    [ UserRoles.MANAGER ]
  ]),
  allManagers: guard.check([
    [ UserRoles.ADMIN ],
    [ UserRoles.MANAGER ],
    [ UserRoles.STREET_MANAGER ],
    [ UserRoles.STREET_ADMIN ]
  ])
}
