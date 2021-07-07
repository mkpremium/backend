import retry from 'bluebird-retry'
import request from 'supertest'
import { DuplicatedEntity } from '../src/db/model'
import { OperatorRepository } from '../src/operator/models'

export const defaultPassword = 'Passw0rd'

export async function operatorLogin (app, credentials = { username: 'admin', password: defaultPassword }) {
  const response = await request(app)
    .post('/operators/login')
    .send(credentials)
    .expect(200)

  return Object.assign({}, response.body, { authorization: `Bearer ${response.body.token}` })
}

export async function createFullOperator (object) {
  const repo = new OperatorRepository()
  return repo.save(object, false)
}

export async function operatorCreate () {
  return createFullOperator(buildUser({
    username: 'operator',
    roles: [
      'OPERATOR'
    ]
  }))
}

const defaultOperatorPrototype = {
  username: `operator`,
  password: defaultPassword,
  agentNumber: `operator`,
  roles: [ 'OPERATOR' ],
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

export async function operatorCreateBusiness () {
  return retry(() => createFullOperator(buildUser({
    username: 'business',
    roles: [
      'BUSINESS'
    ]
  })),
  {
    predicate: error => error instanceof DuplicatedEntity
  }
  )
}

export async function createAdminUser () {
  return createFullOperator(buildUser({
    username: 'admin',
    roles: [
      'ADMIN'
    ]
  }))
}
