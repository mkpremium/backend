import { EntityManager } from 'typeorm'
import { User } from '../user.entity'
import { UserProfileProps } from '../../types/user'
import bcrypt from 'bcrypt'
import { saltFactor } from '../../../config'

interface AddUserCommand {
  em: EntityManager
  username: string
  password: string
  profile: UserProfileProps
}

export async function addUserService (cmd: AddUserCommand) {
  return cmd.em.save(User, {
    username: cmd.username,
    password: await hashPassword(cmd.password),
    enabled: true,
    profile: cmd.profile,
  })
}

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(saltFactor)
  return bcrypt.hash(password, salt)
}
