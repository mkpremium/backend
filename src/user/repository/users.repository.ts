import { UserProps } from '../../types/user'


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

  get (id: string): Promise<UserProps & FlipperProfile>
}
