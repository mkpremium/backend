import { DeepPartial, EntityTarget } from 'typeorm'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { UserProps, UserRoles } from '../../types/user'
import { User } from '../user.entity'
import { UsersRepository } from './users.repository'
import { UserNotFound } from '../../flipper/service/flipper-favorites-buildings.service'

export class PostgresUserRepository extends PostgresRepository<UserProps, User>
  implements UsersRepository {
  protected relations = {
    flipper: { favoriteBuildings: true },
    caller: {
      flipper: true
    }
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

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  protected structToEntity (struct: UserProps): DeepPartial<User> {
    throw new Error('Method not implemented.')
  }

  protected entityToStruct (entity: User): UserProps {
    return mapUserEntityToStruct(entity)
  }

  protected getEntityTarget (): EntityTarget<User> {
    return User
  }
}

export function mapUserEntityToStruct (entity: User) {
  return {
    roles: deriveRoles(entity),
    favoriteBuildings: entity.flipper?.favoriteBuildings?.map(({ id }) => id) ?? [],
    id: entity.id,
    username: entity.username,
    password: entity.password,
    enable: entity.enabled,
    flipperId: entity.caller?.flipperId,
    profile: entity.profile
  }
}

function deriveRoles (user: User) {
  return [user.flipper! && UserRoles.BUSINESS,
    user.caller! && UserRoles.OPERATOR,
    user.isAdmin && UserRoles.ADMIN
  ].filter(Boolean)
}
