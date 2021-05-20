import { createApp } from '../../src/app'
import { defaultPassword, operatorLogin } from '../../test/common'
import request from 'supertest'
import { Bucket, N1qlQuery } from 'couchbase'
import { Express } from 'express'

const DEFAULT_MILLISECONDS_TO_WAIT = 1000

export const initApplication = (): Promise<Express> => createApp()
  .then(app => {
    const bucket = app.locals.diContainer.resolve('couchbaseBucket') as Bucket & { name: string }
    return new Promise((resolve, reject) => {
      bucket.query(N1qlQuery.fromString(`DELETE FROM ${bucket.name}`), error => {
        if (error) {
          reject(error)
        } else {
          resolve(app)
        }
      })
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
