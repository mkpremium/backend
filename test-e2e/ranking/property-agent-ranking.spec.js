import { createFlipper } from '../../test/common'
import { authenticatedGet, initApplication } from '../helper/rest-api-helper'
import { expect } from 'chai'

describe('Property manager profit ranking', function () {
  it('list property managers ranking with default profit goal', async function () {
    const app = await initApplication()

    const businessUser = await createFlipper()

    await authenticatedGet('/stock/ranking', businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(201)
        expect(response.body).to.be.deep.equal([
          {
            userId: businessUser.id,
            userName: businessUser.username,
            userCity: businessUser.profile.city,
            goal: 500000,
            currentProfit: 0,
            percentageGoal: 0,
            awards: [],
            rank: 1,
            maxLine: null
          }
        ])
      })
  })
})
