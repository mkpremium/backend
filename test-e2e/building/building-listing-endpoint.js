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
    const building1 = await createBuilding(app, owner, {buildingId: 'test-building1'})
    const building2 = await createBuilding(app, owner, {buildingId: 'test-building2'})

    await authenticatedGet(`/buildings?id=${building1.id}&id=${building2.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([
          {
            id: building1.id
          },
          {
            id: building2.id
          }
        ])
      })
  })
})
