import { OperatorRepository } from '../../operator/models'
import { History } from '../../history/models'
import { UserProps } from '../../types/user'
import { DataSource } from 'typeorm'
import { addUserService } from './add-user.service'

type AddOperatorCommand = Omit<UserProps, 'favoriteBuildings' | 'restringedHours' | 'enable'>

export class AddOperatorService {
  constructor (
    private ormDataSource: DataSource,
    private operatorRepository: OperatorRepository,
    private usePostgres: boolean,
  ) {
  }

  async addOperator (cmd: AddOperatorCommand, requester: { id: string }): Promise<UserProps> {
    return this.usePostgres ? this.saveInPostgres(cmd) : this.saveInCouchbase(cmd, requester)
  }

  private async saveInCouchbase (cmd: AddOperatorCommand, requester: { id: string }): Promise<UserProps> {
    const operator = await this.operatorRepository.createOperator(cmd)
    await History.registerCreate({
      contextModel: operator,
      user: requester
    })

    return operator
  }

  private async saveInPostgres (cmd: AddOperatorCommand) {
    const user = await addUserService({
      em: this.ormDataSource.manager,
      username: cmd.username,
      password: cmd.password,
      isAdmin: cmd.roles.includes('admin'),
      profile: cmd.profile,
    })

    return {
      enable: user.enabled,
      roles: cmd.roles,
      ...user
    }
  }
}
