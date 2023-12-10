import { jwt } from '../../../config'
import { sign } from 'jsonwebtoken'
import { OperatorRefreshTokenRepository } from '../../operator/operatorRefreshTokenRepository'

export class AuthTokenIssuerService {
  private operatorRefreshTokenRepository: OperatorRefreshTokenRepository

  constructor () {
    this.operatorRefreshTokenRepository = new OperatorRefreshTokenRepository()
  }

  async issueRefreshToken (userId: string) {
    const refreshToken = this.issueToken({ id: userId })
    return this.operatorRefreshTokenRepository.save({operatorId: userId, refreshToken})
  }

  issueToken (payload) {
    const options = {
      expiresIn: jwt.expiresIn
    }

    return sign(payload, jwt.secret, options)
  }
}
