import { expect } from 'chai'
import { operatorCreateBusiness } from '../../test/common'
import { authenticatedGet, authenticatedPost, initApplication } from '../helper/rest-api-helper'

describe('Property agent favourite buildings', () => {
  it('stores property agent favourite buildings', async () => {
    const app = await initApplication()

    const businessUser = await operatorCreateBusiness()

    await authenticatedPost('/favorites', businessUser, app, {
      buildingId: 'building-id'
    }).then(response => expect(response.status).to.be.equal(201))

    return authenticatedGet('/me', businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.contains({
          favoriteBuildings: [
            'building-id'
          ]
        })
      })
  })
})
