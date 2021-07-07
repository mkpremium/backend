import { authenticatedGet, authenticatedPut, initApplication } from '../helper/rest-api-helper'
import { createFlipper } from '../../test/common'
import { createBuilding } from '../helper/mother-of-objects'
import { expect } from 'chai'

describe('set building sale price', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await createFlipper()
  })

  it('sets building sale price', async () => {
    const building = await createBuilding(app, {})

    const salePrice = 1000
    await authenticatedPut(`/buildings/${building.id}/sale-price`, businessUser, app, { salePrice })
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body.salePrice).to.be.equal(salePrice)
      })

    await authenticatedGet(`/buildings?id=${building.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body[ 0 ].salePrice).to.be.equal(salePrice)
      })
  })
})
