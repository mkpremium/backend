import { OperatorRepository } from '../../operator/models'
import bcrypt from 'bcrypt'
import { newHttpError } from '../../lib/http-error'
import { OperatorRefreshTokenRepository } from '../../operator/operatorRefreshTokenRepository'
import { AuthenticatedResponse } from '../../operator/types'

interface Credentials {
  username: string
  password: string
}

type UserToAuthenticate = {
  id: string,
  username: string,
  roles: string[],
  flipperId?: string,
  profile: {
    fullName: () => string,
    city: string,
    queueId: string,
    email: string,
    language: string,
  }
}

export class LoginService {
  constructor (private operatorRepository: OperatorRepository) {
  }

  async login (credentials: Credentials) {
    const { username, password } = credentials
    const operator = await this.operatorRepository.getCredentialsFor(username)
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

  private async createAuthenticatedResponse (user: UserToAuthenticate) {
    const tokenPayload = {
      id: user.id,
      permissions: user.roles,
      flipperId: user.flipperId,
      operator: {
        id: user.id,
        name: user.profile.fullName(),
        username: user.username,
        city: user.profile.city,
        queueId: user.profile.queueId,
        email: user.profile.email,
        language: user.profile.language
      }
    }

    const { refreshToken } = await OperatorRefreshTokenRepository.createToken(user)
    const token = await OperatorRepository.createToken(tokenPayload)

    return AuthenticatedResponse({
      refreshToken,
      token,
      access_token: token,
      token_type: 'bearer',
      roles: user.roles,
      operator: tokenPayload.operator
    })
  }
}
