import { EntityManager } from 'typeorm'
import { User } from '../user.entity'

interface AddUserCommand {
  em: EntityManager
  username: string
  password: string
}

export function addUserService (cmd: AddUserCommand) {
  // TODO: encrypt password
  return cmd.em.save(User, {
    username: cmd.username,
    password: cmd.password,
  })
}
