import { authenticatedGet, authenticatedPut, initApplication } from '../helper/rest-api-helper'
import { createAdminUser, operatorCreateBusiness } from '../../test/common'
import { expect } from 'chai'

describe('Flipper Max Line', () => {
  it('sets max line allow to flipper', async () => {
    const app = await initApplication()

    const flipper = await operatorCreateBusiness()
    const admin = await createAdminUser()

    const testMaxLine = 1000000
    await authenticatedPut(`/flipper/${flipper.id}/max-line`, admin, app, { line: testMaxLine })
      .then(response => {
        expect(response.status).to.be.equal(200)
      })

    return authenticatedGet(`/me`, flipper, app)
      .then(response => {
        expect(response.body.maxLine).to.be.equal(testMaxLine)
      })
  })
})
