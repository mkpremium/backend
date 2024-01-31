import { createFlipper } from '../../test/common'
import { associateBuildingWithOwner, createBuilding, createOwner } from '../helper/mother-of-objects'
import { authenticatedGet, authenticatedPost, initApplication } from '../helper/rest-api-helper'
import { expect } from 'chai'

describe('Building featured owner', function () {
  it('sets featured owner for a building', async function () {
    const app = await initApplication()

    const businessUser = await createFlipper()
    const building = await createBuilding(app)
    const featuredOwner = await createOwner(app)
    await associateBuildingWithOwner(app, featuredOwner, building.id)

    await authenticatedPost(`/buildings/${building.id}/set-featured-owner`, businessUser, app, {
      ownerId: featuredOwner.id
    }).then(response => expect(response.status).to.be.equal(200))
      .catch(expect.fail)

    return authenticatedGet(`/buildings?id=${building.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body[0].owner).to.be.deep.include({ id: featuredOwner.id })
      })
  })
})
