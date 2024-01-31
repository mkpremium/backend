import { expect } from 'chai'
import { createFlipper } from '../../test/common'
import { authenticatedDelete, authenticatedGet, authenticatedPost, initApplication } from '../helper/rest-api-helper'

describe('Property agent favourite buildings', function () {
  it('stores property agent favourite buildings', async function () {
    const app = await initApplication()

    const businessUser = await createFlipper()

    await authenticatedPost('/favorites', businessUser, app, {
      buildingId: 'building-id'
    }).then(response => expect(response.status).to.be.equal(201))

    await authenticatedGet('/me', businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.contains({
          favoriteBuildings: [
            'building-id'
          ]
        })
      })

    await authenticatedDelete('/favorites/building-id', businessUser, app)
      .then(response => expect(response.status).to.be.equal(200))

    await authenticatedGet('/me', businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.deep.contains({
          favoriteBuildings: []
        })
      })
  })
})
