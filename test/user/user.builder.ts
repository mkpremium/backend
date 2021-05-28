import { Operator, OperatorProps } from '../../src/types/operator'

const userPrototype: OperatorProps = {
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
export const userBuilder = (overrides: Partial<OperatorProps> = {}) => ({
  build () {
    return Operator({ ...userPrototype, ...overrides })
  }
})
