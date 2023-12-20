import { Factory } from 'rosie'
import { UserProfileProps, UserRoles } from '../../../src/types/user'
import { AddOperatorService } from '../../../src/user/service/add-operator.service'
import { createTestContainer } from '../../create-test-container'
import { PostgresUserRepository } from '../../../src/user/repository/postgres-user.repository'
import { expect } from 'chai'

describe('AddOperatorService', () => {
  let service: AddOperatorService
  let postgresUsersRepository: PostgresUserRepository

  beforeEach(async () => {
    const container = await createTestContainer({ couchbase: false, postgres: true })
    service = container.resolve('addOperatorService')
    postgresUsersRepository = container.resolve('postgresUsersRepository')
  })

  it('adds flipper', async () => {
    const operator = await addUserWithRole(UserRoles.BUSINESS)

    const user = await postgresUsersRepository.get(operator.id)
    expect(user.roles).to.eql([ UserRoles.BUSINESS ])
  })

  it('adds caller', async () => {
    const operator = await addUserWithRole(UserRoles.OPERATOR)

    const user = await postgresUsersRepository.get(operator.id)
    expect(user.roles).to.eql([ UserRoles.OPERATOR ])
  })

  async function addUserWithRole (role: string) {
    const testCommand = {
      ...Factory.build<{ username: string, password: string }>('user-credentials'),
      profile: Factory.build<UserProfileProps>('user-profile'),
      roles: [ role ],
      enable: true,
    }
    return await service.addOperator(testCommand, { id: 'admin' })
  }
})
