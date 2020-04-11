import { expect } from 'chai'
import { operatorCreateBusiness } from '../../test/common'
import { authenticatedGet, initApplication } from '../rest-api-helper'

describe('Users Meetings', () => {
  it('exposes endpoint to get user meetings', async () => {
    const app = await initApplication()

    const businessUser = await operatorCreateBusiness()

    await authenticatedGet(`/users/${businessUser.id}/meetings`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([])
      })
  })
})
