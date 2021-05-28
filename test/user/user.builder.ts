import { User, UserProfile, UserProfileProps, UserProps } from '../../src/types/user'

const userPrototype: UserProps = {
  id: 'test-user-id',
  email: 'user@email.test',
  username: 'test-user',
  password: 'test-user-password',
  profile: {
    firstName: 'User-Name',
    lastName: 'User-Surname',
    city: 'User CITY',
    language: 'es',
  }
}
export const userBuilder = (overrides: Partial<UserProps> = {}) => ({
  build () {
    return User({ ...userPrototype, ...overrides })
  }
})

export const userProfileBuilder = (overrides: Partial<UserProfileProps> = {}) => ({
  build () {
    return UserProfile({ ...userPrototype.profile, ...overrides })
  }
})
