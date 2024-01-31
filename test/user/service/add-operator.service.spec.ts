import { UserRoles } from '../../../src/types/user'
import { AddOperatorService } from '../../../src/user/service/add-operator.service'
import { createTestContainer } from '../../create-test-container'
import { PostgresUserRepository } from '../../../src/user/repository/postgres-user.repository'
import { expect } from 'chai'
import { addUserWithRole } from '../../helpers'

describe('AddOperatorService', () => {
  let service: AddOperatorService
  let postgresUsersRepository: PostgresUserRepository

  beforeEach(async () => {
    const container = await createTestContainer({ couchbase: false, postgres: true })
    service = container.resolve('addOperatorService')
    postgresUsersRepository = container.resolve('postgresUsersRepository')
  })

  it('adds flipper', async () => {
    const operator = await addUserWithRole(service, UserRoles.BUSINESS as 'BUSINESS')

    const user = await postgresUsersRepository.get(operator.id)
    expect(user.roles).to.eql([UserRoles.BUSINESS])
  })

  it('adds caller', async () => {
    const operator = await addUserWithRole(service, UserRoles.OPERATOR as 'OPERATOR')

    const user = await postgresUsersRepository.get(operator.id)
    expect(user.roles).to.eql([UserRoles.OPERATOR])
  })
})
