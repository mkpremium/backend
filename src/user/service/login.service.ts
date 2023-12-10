import { OperatorRepository } from '../../operator/models'
import bcrypt from 'bcrypt'
import { newHttpError } from '../../lib/http-error'
import { OperatorRefreshTokenRepository } from '../../operator/operatorRefreshTokenRepository'
import { AuthenticatedResponse } from '../../operator/types'
import { CouchbaseUsersRepository } from '../repository/couchbase-users.repository'
import { UserProps } from '../../types/user'
import { jwt } from '../../../config'
import { sign } from 'jsonwebtoken'

interface Credentials {
  username: string
  password: string
}

export class LoginService {
  constructor (
    private couchbaseUsersRepository: CouchbaseUsersRepository,
  ) {
  }

  async login (credentials: Credentials) {
    const { username, password } = credentials
    const operator = await this.couchbaseUsersRepository.getUserWithUsername(username)
    await this.validateUserPassword(operator, password)

    return await this.createAuthenticatedResponse(operator)
  }

  private async validateUserPassword (operator: { enable: boolean, password: string }, password: string) {
    if (!operator) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto')
    }

    if (!operator.enable) {
      throw newHttpError(401, 'Cuenta desactivada, comuníquese con el administrador')
    }

    const valid = await bcrypt.compare(password, operator.password)

    if (!valid) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto')
    }
  }

  private async createAuthenticatedResponse (user: UserProps) {
    const tokenPayload = {
      id: user.id,
      permissions: user.roles,
      flipperId: user.flipperId,
      operator: {
        id: user.id,
        name: [user.profile.firstName, user.profile.lastName].join(' '),
        username: user.username,
        city: user.profile.city,
        queueId: user.profile.queueId,
        email: user.profile.email,
        language: user.profile.language
      }
    }

    const { refreshToken } = await OperatorRefreshTokenRepository.createToken(user)
    const token = await this.createToken(tokenPayload)

    return AuthenticatedResponse({
      refreshToken,
      token,
      access_token: token,
      token_type: 'bearer',
      roles: user.roles,
      operator: tokenPayload.operator
    })
  }

  private async createToken (payload: object) {
    const options = {
      expiresIn: jwt.expiresIn
    }

    return sign(payload, jwt.secret, options)
  }
}
