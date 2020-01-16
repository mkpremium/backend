import { operatorCreateBusiness } from '../../test/common'
import { authenticatedGet, initApplication } from '../rest-api-helper'
import { expect } from 'chai'

describe('Sales agent profit ranking', () => {
  it('list sales agents ranking', async () => {
    const app = await initApplication()

    const businessUser = await operatorCreateBusiness()

    await authenticatedGet('/stock/ranking', businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(201)
        expect(response.body).to.be.deep.equal([
          {
            userId: businessUser.id,
            userName: businessUser.username,
            userCity: businessUser.profile.city,
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
