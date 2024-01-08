import { sign, verify } from 'jsonwebtoken'
import _isNil from 'lodash/isNil'
import t from 'tcomb'
import uuid from 'uuid/v4'
import { jwt } from '../../config'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { bearerTokenExtractor } from '../middleware/jwt'
import { UserProfile, UserRole } from '../types/user'

const OperatorRefreshToken = t.struct(
  {
    id: t.String,
    operatorId: t.String,
    refreshToken: t.String,
    _documentType: t.enums.of([ 'operator-refresh_token' ])
  },
  {
    name: 'OperatorRefreshToken',
    defaultProps: {
      get id () {
        return uuid()
      },
      _documentType: 'operator-refresh_token'
    }
  }
)

export class OperatorRefreshTokenRepository extends CouchbaseModel {
  protected Struct = OperatorRefreshToken

  static async createRefreshToken (payload) {
    const options = {
      expiresIn: jwt.refreshTokenExpiresIn
    }

    return sign(payload, jwt.secret, options)
  }

  static async decodeToken (req) {
    const repo = new OperatorRefreshTokenRepository()
    const token = bearerTokenExtractor(req)
    const options = {}

    await verify(token, jwt.secret, options)
    return repo.findOrThrow(token)
  }

  async findOrThrow (rawToken) {
    const qb = this.getQueryBuilder()
    qb.where('refreshToken = ?', rawToken)
      .limit(1)
    const [ refreshToken ] = await this.query(qb)
    if (!refreshToken) {
      throw newHttpError(401, 'El token es invalido')
    }
    return refreshToken
  }

  static async createToken (operator) {
    const repo = new OperatorRefreshTokenRepository()
    const operatorId = operator.id
    const refreshToken = await OperatorRefreshTokenRepository.createRefreshToken({ id: operatorId })
    return repo.save({
      operatorId,
      refreshToken
    })
  }

  static async consume (id) {
    const repo = new OperatorRefreshTokenRepository()
    const qb = repo.getQueryBuilder('delete')
    qb.where('id = ?', id)
    return repo.deleteQuery(qb)
  }
}

export const passwordRegex = new RegExp('^(?=.*[A-Za-z])(?=.*\\d).{8,}$')
const Password = t.refinement(t.String, n => passwordRegex.test(n), 'Password')
const NotEmptyString = t.refinement(t.String, n => !_isNil(n), 'NotEmptyString')
export const OperatorRequest = t.struct(
  {
    username: NotEmptyString,
    password: Password,
    email: t.maybe(t.String),
    agentNumber: t.maybe(t.String),
    level: t.maybe(t.Number),
    serviceId: t.maybe(t.String),
    enable: t.Boolean,
    flipperId: t.maybe(t.String),
    roles: t.list(UserRole),

    profile: UserProfile
  },
  {
    name: 'OperatorRequest',
    defaultProps: {
      enable: true,
      roles: [],
      features: [],
      profile: {}
    }
  }
)
