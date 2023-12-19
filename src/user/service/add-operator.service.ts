import { OperatorRepository } from '../../operator/models'
import { History } from '../../history/models'
import { UserProps } from '../../types/user'

type AddOperatorCommand = Omit<UserProps, 'favoriteBuildings' | 'restringedHours'>

export class AddOperatorService {
  constructor (
    private operatorRepository: OperatorRepository,
  ) {
  }

  async addOperator (cmd: AddOperatorCommand, requester: { id: string }): Promise<UserProps> {
    return await this.saveInCouchbase(cmd, requester)
  }

  private async saveInCouchbase (cmd: AddOperatorCommand, requester: { id: string }): Promise<UserProps> {
    const operator = await this.operatorRepository.createOperator(cmd)
    await History.registerCreate({
      contextModel: operator,
      user: requester
    })

    return operator
  }
}
