import globalApp, { dependenciesPromise } from '../src/app'
import { defaultPassword, deleteAll, operatorLogin } from '../test/common'
import request from 'supertest'

export const initApplication = async () => {
  await dependenciesPromise

  await deleteAll()

  return globalApp
}

export const authenticatedGet = async (endpoint, user, app) => {
  const authenticatedUser = await operatorLogin(app,
    {username: user.username, password: defaultPassword})

  return request(app)
    .get(endpoint)
    .set('Authorization', authenticatedUser.authorization)
}

export const authenticatedPost = async (endpoint, user, app, body) => {
  const authenticatedUser = await operatorLogin(app,
    {username: user.username, password: defaultPassword})

  return request(app)
    .post(endpoint)
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Authorization', authenticatedUser.authorization)
}
