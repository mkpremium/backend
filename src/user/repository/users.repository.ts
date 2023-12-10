import { UserProps } from '../../types/user'

export interface UsersRepository {
  getUserWithUsername (username): Promise<UserProps>
}
