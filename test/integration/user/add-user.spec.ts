import { createTestApp } from '../create-test-app'
import { AwilixContainer } from 'awilix'
import { createAdminUserWithPostgres, operatorLogin } from '../../common'
import { Factory } from 'rosie'
import request from 'supertest'
import { expect } from 'chai'
import { Application } from 'express'

describe('AddOperatorService', () => {
  let app: Application
  let loggedInAdmin

  before(async () => {
    app = await createTestApp('postgres')
    const container = app.locals.diContainer as AwilixContainer
    await createAdminUserWithPostgres(container)

    loggedInAdmin = await operatorLogin(app)
  })

  it('adds user with hashed password', async () => {
    const testCommand = {
      ...Factory.build<{ username: string, password: string }>('user-credentials'),
      profile: Factory.build('user-profile'),
      roles: ['ADMIN'],
      enable: true
    }
    const response = await request(app)
      .post('/operators/')
      .set('Authorization', loggedInAdmin.authorization)
      .send(testCommand)
      .expect(201)

    expect(response.body.password).to.not.eql(testCommand.password)
  })
})
