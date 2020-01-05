import Promise from 'bluebird'
import request from 'supertest'
import { OperatorRepository } from '../src/operator/models'
import { cleanFirebase } from '../migrations/firebase-clean'
import { cleanQueue } from '../cli/lib/migrate-utils'
import { CouchbaseModel } from '../src/db/model'
import initCouchbase from '../src/db/couchbase'

export async function deleteAll () {
  initCouchbase()

  await CouchbaseModel.prototype._promiseBucket

  return Promise.all([
    cleanFirebase(),
    CouchbaseModel.prototype._bucket.removeAll(),
    cleanQueue()
  ])
}

export async function operatorLogin (app, credentials = { username: 'admin', password: 'Passw0rd' }) {
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

export async function operatorCreate (index = '', queueId) {
  return createFullOperator({
    username: `operator${index}`,
    password: 'Passw0rd',
    agentNumber: `operator${index}`,
    roles: [
      'OPERATOR'
    ],
    profile: {
      queueId,
      firstName: 'operator',
      lastName: 'operator',
      city: 'barcelona',
      email: 'operator@example.com'
    }
  })
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
  return createFullOperator({
    username: 'business',
    password: 'Passw0rd',
    agentNumber: 'business',
    roles: [
      'BUSINESS'
    ],
    profile: {
      firstName: 'business',
      lastName: 'operator',
      city: 'barcelona'
    }
  })
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

export const defaultPassword = 'Passw0rd'
