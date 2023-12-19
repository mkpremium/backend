import { UserProps } from '../../types/user'
import { EntityNotFound } from '../../db/errors'


interface Signature {
  id: string
  image: string // base64 png
  description: string
}

interface FlipperProfile {
  signatures?: {
    user: Signature,
    city: Signature
  }
  maxLine?: number
}

export interface UsersRepository {
  getUserWithUsername (username: string): Promise<UserProps>

  // Throws EntityNotFound if user not found.
  get (id: string): Promise<UserProps & FlipperProfile>
}
