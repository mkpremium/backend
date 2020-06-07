import Promise from 'bluebird'
import request from 'supertest'
import { OperatorRepository } from '../src/operator/models'
import { CouchbaseModel } from '../src/db/model'
import initCouchbase from '../src/db/couchbase'

export async function deleteAll () {
  await initCouchbase()

  await CouchbaseModel.prototype._promiseBucket

  return Promise.all([
    CouchbaseModel.prototype._bucket.removeAll()
  ])
}

export const defaultPassword = 'Passw0rd'

export async function operatorLogin (app, credentials = {username: 'admin', password: defaultPassword}) {
  const response = await request(app)
    .post('/operators/login')
    .send(credentials)
    .expect(200)

  return Object.assign({}, response.body, {authorization: `Bearer ${response.body.token}`})
}

export async function createFullOperator (object) {
  const repo = new OperatorRepository()
  return repo.save(object, false)
}

export async function operatorCreate () {
  return createFullOperator(buildOperator({
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
  roles: ['OPERATOR'],
  profile: {
    queueId: 'queueId',
    firstName: 'operator',
    lastName: 'operator',
    city: 'barcelona',
    email: 'operator@example.com'
  }
}

export const buildOperator = (operator = {}, prototype = defaultOperatorPrototype) => {
  return {
    ...prototype, ...operator
  }
}

export async function operatorCreateAdmin (queueId) {
  return createFullOperator({
    username: 'admin',
    password: 'Passw0rd',
    agentNumber: 'admin',
    roles: [
      'ADMIN'
    ],
    profile: {
      queueId,
      firstName: 'admin',
      lastName: 'operator',
      city: 'barcelona'
    }
  })
}

export async function operatorCreateStreet () {
  return createFullOperator({
    username: 'street',
    password: 'Passw0rd',
    agentNumber: 'street',
    roles: [
      'STREET'
    ],
    profile: {
      firstName: 'street',
      lastName: 'operator',
      city: 'barcelona',
      neighborhood: 'VALLCARCA I ELS PENITENTS'
    }
  })
}

export async function operatorCreateBusiness () {
  return createFullOperator(buildOperator({
    username: 'business',
    roles: [
      'BUSINESS'
    ]
  }))
}

export async function operatorCreateManager (queueId) {
  return createFullOperator({
    username: 'manager',
    password: 'Passw0rd',
    agentNumber: 'manager',
    roles: [
      'MANAGER'
    ],
    profile: {
      queueId,
      firstName: 'manager',
      lastName: 'operator',
      city: 'barcelona'
    }
  })
}

export async function operatorCreateStreetManager () {
  return createFullOperator({
    username: 'street_manager',
    password: 'Passw0rd',
    agentNumber: 'street_manager',
    roles: [
      'STREET_MANAGER'
    ],
    profile: {
      firstName: 'street_manager',
      lastName: 'operator',
      city: 'barcelona'
    }
  })
}
