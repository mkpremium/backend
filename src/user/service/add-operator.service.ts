import { OperatorRepository } from '../../operator/models'
import { History } from '../../history/models'

export class AddOperatorService {
  constructor (
    private operatorRepository: OperatorRepository,
  ) {
  }

  async addOperator (body: any, user: any) {
    return await this.saveInCouchbase(body, user)
  }

  private async saveInCouchbase (body: any, user: any) {
    const operator = await this.operatorRepository.createOperator(body)
    await History.registerCreate({
      contextModel: operator,
      user: user
    })

    return operator
  }
}
