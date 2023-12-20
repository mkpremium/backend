import { DeepPartial, EntityTarget } from 'typeorm'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { UserProps, UserRoles } from '../../types/user'
import { User } from '../user.entity'
import { UsersRepository } from './users.repository'
import { UserNotFound } from '../../flipper/service/flipper-favorites-buildings.service'

export class PostgresUserRepository extends PostgresRepository<UserProps, User>
  implements UsersRepository {
  protected relations = {
    flipper: true,
    caller: true,
  }

  async getUserWithUsername (username: string) {
    const user = await this.repository.findOne({
      where: { username },
      relations: this.relations
    })
    if (!user) {
      throw new UserNotFound(username)
    }

    return this.entityToStruct(user)
  }

  protected structToEntity (struct: UserProps): DeepPartial<User> {
    throw new Error('Method not implemented.')
  }

  protected entityToStruct (entity: User): UserProps {
    return {
      roles: this.deriveRoles(entity),
      favoriteBuildings: [],
      id: entity.id,
      username: entity.username,
      password: entity.password,
      enable: entity.enabled,
      flipperId: entity.caller?.flipperId,
      profile: entity.profile,
    }
  }

  protected getEntityTarget (): EntityTarget<User> {
    return User
  }

  private deriveRoles (user: User) {
    return [ user.flipper!! && UserRoles.BUSINESS,
      user.caller!! && UserRoles.OPERATOR,
      user.isAdmin && UserRoles.ADMIN,
    ].filter(Boolean)
  }

}
