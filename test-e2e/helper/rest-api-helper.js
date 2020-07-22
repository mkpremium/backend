import globalApp, { dependenciesPromise } from '../../src/app'
import { defaultPassword, deleteAll, operatorLogin } from '../../test/common'
import request from 'supertest'

const DEFAULT_MILLISECONDS_TO_WAIT = 1000

export const initApplication = async () => {
  await dependenciesPromise

  await deleteAll()
  await new Promise(resolve => setTimeout(resolve, 100))

  return globalApp
}

export const authenticatedGet = async (endpoint, user, app) => {
  const authenticatedUser = await operatorLogin(app,
    {username: user.username, password: defaultPassword})

  return request(app)
    .get(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .set('Authorization', authenticatedUser.authorization)
}

export const authenticatedDelete = async (endpoint, user, app) => {
  const authenticatedUser = await operatorLogin(app,
    {username: user.username, password: defaultPassword})

  return request(app)
    .delete(endpoint)
    .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .set('Authorization', authenticatedUser.authorization)
}

export const authenticatedPost = async (endpoint, user, app, body) => {
  const authenticatedUser = await operatorLogin(app,
    {username: user.username, password: defaultPassword})

  return request(app)
    .post(endpoint)
    // .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Authorization', authenticatedUser.authorization)
}

export const authenticatedPut = async (endpoint, user, app, body) => {
  const authenticatedUser = await operatorLogin(app,
    {username: user.username, password: defaultPassword})

  return request(app)
    .put(endpoint)
    // .timeout(DEFAULT_MILLISECONDS_TO_WAIT)
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Authorization', authenticatedUser.authorization)
}
