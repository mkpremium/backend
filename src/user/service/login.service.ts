import { OperatorRepository } from '../../operator/models'
import bcrypt from 'bcrypt'
import { newHttpError } from '../../lib/http-error'
import { OperatorRefreshTokenRepository } from '../../operator/operatorRefreshTokenRepository'
import { AuthenticatedResponse } from '../../operator/types'

interface Credentials {
  username: string
  password: string
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

  private async createAuthenticatedResponse (operator) {
    const tokenPayload = {
      id: operator.id,
      permissions: operator.roles,
      flipperId: operator.flipperId,
      operator: {
        id: operator.id,
        name: operator.profile.fullName(),
        username: operator.username,
        city: operator.profile.city,
        queueId: operator.profile.queueId,
        email: operator.profile.email,
        language: operator.profile.language
      }
    }

    const { refreshToken } = await OperatorRefreshTokenRepository.createToken(operator)
    const token = await OperatorRepository.createToken(tokenPayload)

    return AuthenticatedResponse({
      refreshToken,
      token,
      access_token: token,
      token_type: 'bearer',
      roles: operator.roles,
      operator: tokenPayload.operator
    })
  }
}
