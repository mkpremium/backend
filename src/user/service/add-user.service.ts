import { EntityManager } from 'typeorm'
import { User } from '../user.entity'
import { UserProfileProps } from '../../types/user'
import bcrypt from 'bcrypt'
import { saltFactor } from '../../../config'
import { passwordRegex } from '../../operator/operatorRefreshTokenRepository'

interface AddUserCommand {
  em: EntityManager
  id?: string
  username: string
  password: string
  profile: UserProfileProps
  isAdmin?: boolean
}

export async function addUserService (cmd: AddUserCommand) {
  return cmd.em.save(User, {
    username: cmd.username,
    password: isHashedPassword(cmd.password) ? cmd.password : await hashPassword(assertPasswordIsSecure(cmd.password)),
    enabled: true,
    isAdmin: cmd.isAdmin ?? false,
    profile: cmd.profile,
  })
}

async function hashPassword (password: string) {
  const salt = await bcrypt.genSalt(saltFactor)
  return bcrypt.hash(password, salt)
}

function assertPasswordIsSecure (password: string) {
  if (passwordRegex.test(password)) {
    return password
  }

  throw new Error('Password is not secure')
}


function isHashedPassword (password: string) {
  return /^\$2\w\$\d{2}\$/.test(password)
}
