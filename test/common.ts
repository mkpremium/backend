import request from 'supertest'
import { OperatorRepository } from '../src/operator/models'
import { AwilixContainer } from 'awilix'
import { addUserService } from '../src/user/service/add-user.service'
import { DataSource } from 'typeorm'
import { User } from '../src/user/user.entity'

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

export async function createFullOperator (object) {
  const repo = new OperatorRepository()
  return repo.save(object)
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
  const [existingAdmin] = await dataSource.manager.findBy(User, { username: 'admin' })
  if (existingAdmin) {
    return existingAdmin
  }

  return addUserService({
    em: dataSource.manager,
    username: 'admin',
    password: defaultPassword,
    isAdmin: true,
    profile: {
      firstName: 'test',
      lastName: 'admin',
      city: 'Barcelona',
      email: 'admin@test.org',
      language: 'es'
    }
  })
}
