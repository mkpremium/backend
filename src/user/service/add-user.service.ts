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
  isAdmin?: boolean
}

export async function addUserService (cmd: AddUserCommand) {
  return cmd.em.save(User, {
    username: cmd.username,
    password: await hashPassword(cmd.password),
    enabled: true,
    isAdmin: cmd.isAdmin ?? false,
    profile: cmd.profile,
  })
}

async function hashPassword(password: string) {
  const isAlreadyHashed = /^\$2\w\$\d{2}\$/.test(password)
  if (isAlreadyHashed) {
    return password
  }

  const salt = await bcrypt.genSalt(saltFactor)
  return bcrypt.hash(password, salt)
}
