import { expect } from 'chai'
import { createFlipper } from '../../test/common'
import { createBuilding } from '../helper/mother-of-objects'
import { authenticatedGet, authenticatedPut, initApplication } from '../helper/rest-api-helper'

describe('negotiation status change', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await createFlipper()
  })

  it('changes building negotiation status', async () => {
    const building = await createBuilding(app, {})

    await authenticatedPut(
      `/buildings/${building.id}/negotiation-status`, businessUser, app, { status: 'COMPRADO' })
      .then(response => {
        expect(response.status).to.be.equal(200)
      })

    await authenticatedGet(`/buildings?id=${building.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body[ 0 ].negotiationStatus).to.be.equal('COMPRADO')
      })
  })
})
