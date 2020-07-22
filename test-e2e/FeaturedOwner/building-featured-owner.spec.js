import { operatorCreateBusiness } from '../../test/common'
import { createBuilding } from '../helper/mother-of-objects'
import { authenticatedGet, authenticatedPost, initApplication } from '../helper/rest-api-helper'
import { expect } from 'chai'

describe('Building featured owner', () => {
  it('sets featured owner for a building', async () => {
    const app = await initApplication()

    const businessUser = await operatorCreateBusiness()
    const ownerId = 'owner-id'
    const building = await createBuilding(app)

    await authenticatedPost(`/buildings/${building.id}/set-featured-owner`, businessUser, app, {
      ownerId
    }).then(response => expect(response.status).to.be.equal(200))
      .catch(expect.fail)

    return authenticatedGet(`/buildings?id=${building.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body[0]).to.be.deep.include({
          owner: { id: 'owner-id' }
        })
      })
  })
})
