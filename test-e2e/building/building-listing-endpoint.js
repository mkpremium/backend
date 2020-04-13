import { expect } from 'chai'
import { operatorCreateBusiness } from '../../test/common'
import { createBuilding, createOwner } from '../helper/mother-of-objects'
import { authenticatedGet, initApplication } from '../helper/rest-api-helper'

describe('Building listing endpoint', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
  })

  it('returns list of given building IDs', async () => {
    const owner = await createOwner(app)
    const building = await createBuilding(app, owner)

    await authenticatedGet(`/buildings?id=${building.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
      })
  })
})
