import { createApp } from '../../src/app'
import { defaultPassword, operatorLogin } from '../../test/common'
import request from 'supertest'
import { Database } from '../../src/infrastructure/database'
import { AwilixContainer } from 'awilix'
import { Bucket } from 'couchbase'
import { Application } from 'express'

const DEFAULT_MILLISECONDS_TO_WAIT = 1000

export function initApplication (database: Database = 'couchbase'): Promise<Application | [ Application, AwilixContainer ]> {
  return createApp(database)
    .then(app => {
      const diContainer = app.locals.diContainer as AwilixContainer
      const bucket = diContainer.resolve('couchbaseBucket') as Bucket
      return new Promise(resolve => {
        bucket.manager().flush(
          () => setTimeout(() => resolve(database === 'postgres' ? [ app, diContainer ] : app), 500)
        )
      })
    })
}

export async function authenticatedGet (endpoint, user, app) {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .get(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .set('Authorization', authenticatedUser.authorization)
}

export async function authenticatedDelete (endpoint, user, app) {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .delete(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .set('Authorization', authenticatedUser.authorization)
}

export async function authenticatedPost (endpoint, user, app, body) {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .post(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Authorization', authenticatedUser.authorization)
}

export async function authenticatedPut (endpoint, user, app, body) {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .put(endpoint)
    // .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Authorization', authenticatedUser.authorization)
}
