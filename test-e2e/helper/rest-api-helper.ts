import { createApp } from '../../src/app'
import { defaultPassword, operatorLogin } from '../../test/common'
import request from 'supertest'
import { Database } from '../../src/infrastructure/database'
import { AwilixContainer } from 'awilix'
import { Bucket } from 'couchbase'
import { Application } from 'express'

const DEFAULT_MILLISECONDS_TO_WAIT = 1000

export const initApplication = (database: Database = 'couchbase'): Promise<Application | [ Application, AwilixContainer ]> => createApp(database)
  .then(app => {
    const diContainer = app.locals.diContainer as AwilixContainer
    const bucket = diContainer.resolve('couchbaseBucket') as Bucket
    return new Promise(resolve => {
      bucket.manager().flush(
        () => setTimeout(() => resolve(database === 'postgres' ? [ app, diContainer ] : app), 500)
      )
    })
  })

export const authenticatedGet = async (endpoint, user, app) => {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .get(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .set('Authorization', authenticatedUser.authorization)
}

export const authenticatedDelete = async (endpoint, user, app) => {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .delete(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .set('Authorization', authenticatedUser.authorization)
}

export const authenticatedPost = async (endpoint, user, app, body) => {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .post(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Authorization', authenticatedUser.authorization)
}

export const authenticatedPut = async (endpoint, user, app, body) => {
  const authenticatedUser = await operatorLogin(app,
    { username: user.username, password: defaultPassword })

  return request(app)
    .put(endpoint)
    // .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Authorization', authenticatedUser.authorization)
}
