import { DataSource, EntityManager } from 'typeorm'
import { User } from '../user.entity'
import { UserProfileProps } from '../../types/user'
import bcrypt from 'bcrypt'
import { saltFactor } from '../../../config'
import { EventBus } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import { PostgresUserRepository } from '../repository/postgres-user.repository'

export interface AddUserCommand {
  em: EntityManager
  id?: string
  username: string
  password: string
  enabled: boolean,
  profile: UserProfileProps
  isAdmin?: boolean

}

export const passwordRegex = new RegExp('^(?=.*[A-Za-z])(?=.*\\d).{8,}$')
export class AddUserService {
  constructor (
    private usersRepository: PostgresUserRepository,
    private ormDataSource: DataSource,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async addUserService (cmd: AddUserCommand) {
    return cmd.em.save(User, {
      id: cmd.id,
      username: cmd.username,
      password: this.isHashedPassword(cmd.password)
        ? cmd.password
        : await this.hashPassword(this.assertPasswordIsSecure(cmd.password)),
      enabled: true,
      isAdmin: cmd.isAdmin ?? false,
      profile: cmd.profile
    })
  }

  private async hashPassword (password: string) {
    const salt = await bcrypt.genSalt(saltFactor)
    return bcrypt.hash(password, salt)
  }

  private assertPasswordIsSecure (password: string) {
    if (passwordRegex.test(password)) {
      return password
    }
    throw new Error('Password is not secure')
  }

  private isHashedPassword (password: string) {
    return /^\$2\w\$\d{2}\$/.test(password)
  }
}
