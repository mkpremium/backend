import request from 'supertest'
import { AwilixContainer } from 'awilix'
import { DataSource } from 'typeorm'
import { User } from '../src/user/user.entity'
import { AddUserService, AddUserCommand } from '../src/user/service/add-user.service'

export const defaultPassword = 'Passw0rd'

export async function operatorLogin (app, credentials = { username: 'admin', password: defaultPassword }): Promise<{
  authorization: string
}> {
  const response = await request(app)
    .post('/operators/login')
    .send(credentials)
    .expect(200)

  return Object.assign({}, response.body, { authorization: `Bearer ${response.body.token}` })
}

const defaultOperatorPrototype = {
  username: 'operator',
  password: defaultPassword,
  agentNumber: 'operator',
  roles: ['OPERATOR'],
  profile: {
    queueId: 'queueId',
    firstName: 'operator',
    lastName: 'operator',
    city: 'barcelona',
    email: 'operator@example.com'
  }
}

export const buildUser = (operator = {}, prototype = defaultOperatorPrototype) => {
  return {
    ...prototype, ...operator
  }
}

export async function createAdminUserWithPostgres (container: AwilixContainer) {
  const dataSource = container.resolve('ormDataSource') as DataSource
  const addUserServiceInstance = container.resolve<AddUserService>('addUserService')
  const [existingAdmin] = await dataSource.manager.findBy(User, { username: 'admin' })
  if (existingAdmin) {
    return existingAdmin
  }

  const addUserCommand: AddUserCommand = {
    em: dataSource.manager,
    username: 'admin',
    password: defaultPassword,
    isAdmin: true,
    enabled: true,
    profile: {
      firstName: 'test',
      lastName: 'admin',
      city: 'Barcelona',
      email: 'admin@test.org',
      language: 'es'
    }
  }

  return addUserServiceInstance.addUserService(addUserCommand)
}
