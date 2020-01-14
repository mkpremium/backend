import app, { dependenciesPromise } from '../../src/app'
import request from 'supertest'
import { defaultPassword, operatorLogin, operatorCreateBusiness, deleteAll } from '../../test/common'
import { expect } from 'chai'

describe('Sales agent profit ranking', () => {
  it('list sales agents ranking', async () => {
    await dependenciesPromise

    await deleteAll()

    const operator = await operatorCreateBusiness()
    const authenticatedOperator = await operatorLogin(app,
      {username: operator.username, password: defaultPassword})

    await request(app)
      .get('/stock/ranking')
      .set('Authorization', authenticatedOperator.authorization)
      .expect(201)
      .then(response => {
        expect(response.body).to.be.deep.equal([
          {
            userId: operator.id,
            userName: operator.username,
            userCity: operator.profile.city,
            goal: 0,
            currentProfit: 0,
            percentageGoal: 0,
            awards: [],
            rank: 1
          }
        ])
      })
  })
})
