import { expect } from 'chai'
import { createFlipper } from '../../test/common'
import { createBuilding } from '../helper/mother-of-objects'
import { authenticatedPost, initApplication } from '../helper/rest-api-helper'

describe('Sign building documents URL', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await createFlipper()
  })

  it('returns empty array for building without documents', async () => {
    const testBuilding = await createBuilding(app, { metadata: [] })

    await authenticatedPost(`/buildings/${testBuilding.id}/documents-signed-urls`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([])
      })
  })
})
