import { operatorCreateBusiness } from '../../test/common'
import { authenticatedGet, authenticatedPost, initApplication } from '../rest-api-helper'
import { expect } from 'chai'

describe('Featured owner for a building and property manager', () => {
  it('sets featured owner for a building', async () => {
    const app = await initApplication()

    const businessUser = await operatorCreateBusiness()

    await authenticatedPost('/buildings/building-id/set-featured-owner', businessUser, app, {
      ownerId: 'owner-id'
    }).then(response => expect(response.status).to.be.equal(200))

    return authenticatedGet('/me', businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.contains({
          featuredOwners: [
            {
              buildingId: 'building-id',
              ownerId: 'owner-id'
            }
          ]
        })
      })
  })
})
