import { User, UserProfile, UserProfileProps, UserProps } from '../../src/types/user'

const userPrototype: UserProps = {
  id: 'test-user-id',
  username: 'test-user',
  password: 'test-user-password',
  profile: {
    firstName: 'User-Name',
    lastName: 'User-Surname',
    city: 'User CITY',
    language: 'es',
    email: 'user@email.test'
  },
  enable: true,
  roles: []
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
