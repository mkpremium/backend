import { createTestApp } from '../../integration/create-test-app'
import { AwilixContainer } from 'awilix'
import { createAdminUserWithPostgres, operatorLogin } from '../../common'
import { Factory } from 'rosie'
import request from 'supertest'
import { expect } from 'chai'

describe('AddOperatorService', () => {
  it('adds user', async () => {
    const app = await createTestApp('postgres')
    const container = app.locals.diContainer as AwilixContainer
    await createAdminUserWithPostgres(container)

    const loggedInAdmin = await operatorLogin(app)

    const testCommand = {
      ...Factory.build<{username: string, password: string}>('user-credentials'),
      profile: Factory.build('user-profile'),
      roles: [],
      enable: true,
    }
    const response = await request(app)
      .post('/operators/')
      .set('Authorization', loggedInAdmin.authorization)
      .send(testCommand)
      .expect(201)

    expect(response.body.password).to.not.eql(testCommand.password)
  })
})
