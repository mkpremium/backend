import { OperatorRepository } from '../../operator/models'

interface Credentials {
  username: string
  password: string
}

export class LoginService {
  constructor (private operatorRepository: OperatorRepository) {
  }

  async login(credentials: Credentials) {
    const operator = await this.operatorRepository.findByCredential(credentials)
    return await this.operatorRepository.createAuthenticatedResponse(operator)
  }
}
