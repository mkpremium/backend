import { OperatorRepository } from '../../operator/models'
import { History } from '../../history/models'

export class AddOperatorService {
  async addOperator (body: any, user: any) {
    const repo = new OperatorRepository()
    const operator = await repo.createOperator(body)
    await History.registerCreate({
      contextModel: operator,
      user: user
    })

    return operator
  }
}
