import bcrypt from 'bcrypt'
import { newHttpError } from '../../lib/http-error'
import { AuthenticatedResponse } from '../../operator/types'
import { CouchbaseUsersRepository } from '../repository/couchbase-users.repository'
import { UserProps } from '../../types/user'
import { PostgresUserRepository } from '../repository/postgres-user.repository'
import { AuthTokenIssuerService } from './auth-token-issuer.service'

export interface Credentials {
  username: string
  password: string
}

export class LoginService {
  constructor (
    private couchbaseUsersRepository: CouchbaseUsersRepository,
    private postgresUsersRepository: PostgresUserRepository,
    private authTokenIssuerService: AuthTokenIssuerService,
    private usePostgres: boolean
  ) {
  }

  async login (credentials: Credentials) {
    const { username, password } = credentials
    const user =
      await (this.usePostgres ? this.getPostgresUser(username) : this.getCouchbaseUser(username))
    await this.validateUserPassword(user, password)

    return await this.createAuthenticatedResponse(user)
  }

  async createAuthenticatedResponse (user: UserProps) {
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

    const token = this.authTokenIssuerService.issueToken(tokenPayload)

    return AuthenticatedResponse({
      token,
      access_token: token,
      token_type: 'bearer',
      roles: user.roles,
      operator: tokenPayload.operator
    })
  }

  private getPostgresUser (username: string) {
    return this.postgresUsersRepository.getUserWithUsername(username)
  }

  private getCouchbaseUser (username: string) {
    return this.couchbaseUsersRepository.getUserWithUsername(username)
  }

  private async validateUserPassword (user: Pick<UserProps, 'enable' | 'password'>, password: string) {
    if (!user) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto')
    }

    if (!user.enable) {
      throw newHttpError(401, 'Cuenta desactivada, comuníquese con el administrador')
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto')
    }
  }
}
