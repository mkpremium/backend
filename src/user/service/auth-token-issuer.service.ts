import { jwt } from '../../../config'
import { sign } from 'jsonwebtoken'

export class AuthTokenIssuerService {
  issueToken (payload) {
    const options = {
      expiresIn: jwt.expiresIn
    }

    return sign(payload, jwt.secret, options)
  }
}
