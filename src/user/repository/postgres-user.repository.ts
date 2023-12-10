import { DeepPartial, EntityTarget } from 'typeorm'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { UserProps } from '../../types/user'
import { User } from '../user.entity'

export class PostgresUserRepository extends PostgresRepository<UserProps, User> {
  protected structToEntity (struct: UserProps): DeepPartial<User> {
    throw new Error('Method not implemented.')
  }

  protected entityToStruct (entity: User): UserProps {
    throw new Error('Method not implemented.')
  }

  protected getEntityTarget (): EntityTarget<User> {
    return User
  }

}
