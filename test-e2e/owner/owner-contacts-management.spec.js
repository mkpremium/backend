import { expect } from 'chai'
import { operatorCreateBusiness } from '../../test/common'
import { createOwner, testPhoneContactId } from '../helper/mother-of-objects'
import { authenticatedPut, initApplication } from '../helper/rest-api-helper'

describe('Building owner contacts management', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
  })

  it('modifies a contact', async () => {
    const owner = await createOwner(app)

    const contactInfoToUpdate = {
      type: 'EMAIL',
      value: 'test@example.org',
      status: 'GOOD'
    }
    await authenticatedPut(`/owners/${owner.id}/contacts/${testPhoneContactId}`, businessUser, app, contactInfoToUpdate)
      .then(async (response) => {
        expect(response.status).to.be.equal(204)
        const { ownerRepository } = app.locals.legacyDependenciesContainer
        const savedOwner = await ownerRepository.findById(owner.id)

        expect(savedOwner.person.contacts.length).to.be.equal(1)
        expect(savedOwner.person.contacts[ 0 ]).to.be.deep.equal({
          id: testPhoneContactId,
          note: null,
          ...contactInfoToUpdate
        })
      })
  })
})
