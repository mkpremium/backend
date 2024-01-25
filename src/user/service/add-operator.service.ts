import { OperatorRepository } from '../../operator/models'
import { History } from '../../history/models'
import { UserProps, UserRoles } from '../../types/user'
import { DataSource } from 'typeorm'
import { addUserService } from './add-user.service'
import { Flipper } from '../../flipper/flipper.entity'
import { Caller } from '../../caller/caller.entity'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'

export type AddOperatorCommand = Omit<UserProps, 'id' | 'favoriteBuildings' | 'restringedHours' | 'enable'> & {
  id?: string
}

export class AddOperatorService {
  constructor (
    private ormDataSource: DataSource,
    private operatorRepository: OperatorRepository,
    private usePostgres: boolean,
    private eventBus: EventPublisher,
  ) {
  }

  async addOperator (cmd: AddOperatorCommand, requester: { id: string }): Promise<UserProps & {
    callerId?: string,
    flipperId?: string
  }> {
    return this.usePostgres ? this.saveInPostgres(cmd, requester.id) : this.saveInCouchbase(cmd, requester)
  }

  private async saveInCouchbase (cmd: AddOperatorCommand, requester: { id: string }): Promise<UserProps> {
    const operator = await this.operatorRepository.createOperator(cmd)
    await History.registerCreate({
      contextModel: operator,
      user: requester
    })

    return operator
  }

  private async saveInPostgres (cmd: AddOperatorCommand, requesterId: string) {
    return this.ormDataSource.transaction(async em => {
      const user = await addUserService({
        em,
        id: cmd.id,
        username: cmd.username,
        password: cmd.password,
        isAdmin: cmd.roles.includes(UserRoles.ADMIN),
        profile: cmd.profile,
      })
      let flipperId: string
      let callerId: string
      if (cmd.roles.includes(UserRoles.BUSINESS)) {
        const flipper = await em.save(Flipper, { user })
        flipperId = flipper.id
      }
      if (cmd.roles.includes(UserRoles.OPERATOR)) {
        const callerPayload = { user }
        if (cmd.flipperId) {
          const flipper = await em.findOneOrFail(Flipper, {
            where: { user: { id: cmd.flipperId } },
          })
          callerPayload[ 'flipper' ] = { id: flipper.id }
        }

        const caller = await em.save(Caller, callerPayload)
        callerId = caller.id
      }

      await this.eventBus.publish({
        name: DomainEventCatalog.USER__OPERATOR_ADDED,
        id: user.id,
        createdBy: requesterId,
        flipperId,
        callerId,
      }, em)

      return {
        enable: user.enabled,
        roles: cmd.roles,
        callerId,
        flipperId,
        ...user
      }
    })

  }
}
