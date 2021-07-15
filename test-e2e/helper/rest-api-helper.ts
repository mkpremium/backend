import { createApp } from '../../src/app'
import { defaultPassword, operatorLogin } from '../../test/common'
import request from 'supertest'
import { Bucket } from 'couchbase'

const DEFAULT_MILLISECONDS_TO_WAIT = 5000

export const initApplication = () => createApp()
  .then(app => {
    const bucket: Bucket = app.locals.diContainer.resolve('couchbaseBucket')
    console.time('e2eFlush')
    return bucket.cluster.buckets().flushBucket(
      bucket.name,
    ).then(() => {
      console.timeEnd('e2eFlush')
      return new Promise(resolve => setTimeout(() => resolve(app), 1000))
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
