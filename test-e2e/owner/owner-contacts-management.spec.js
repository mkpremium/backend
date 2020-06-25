import { expect } from 'chai'
import { operatorCreateBusiness } from '../../test/common'
import { createOwner, testContactPhone, testPhoneContactId } from '../helper/mother-of-objects'
import { authenticatedGet, authenticatedPost, authenticatedPut, initApplication } from '../helper/rest-api-helper'

describe('Building owner contacts management', () => {
  let app, businessUser, owner

  before(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
  })

  beforeEach(async () => {
    owner = await createOwner(app)
  })

  it('modifies a contact', async () => {
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

  it('adds a contact', async () => {
    const contactInfoToAdd = {
      type: 'EMAIL',
      value: 'test@example.org',
      status: 'GOOD'
    }

    await authenticatedPost(`/owners/${owner.id}/contacts`, businessUser, app, contactInfoToAdd)
      .then(async (response) => {
        expect(response.status).to.be.equal(200)
        const { ownerRepository } = app.locals.legacyDependenciesContainer
        const savedOwner = await ownerRepository.findById(owner.id)

        expect(savedOwner.person.contacts.length).to.be.equal(2)
        expect(savedOwner.person.contacts[ 1 ]).to.include(contactInfoToAdd)
      })
  })

  it('list owners with matching phone number', async () => {
    await authenticatedGet(`/owners?contactNumber=${testContactPhone}`, businessUser, app)
      .then(async (response) => {
        expect(response.status).to.be.equal(200)

        expect(response.body.results).to.have.lengthOf(1)
        expect(response.body.results[ 0 ]).to.include({
          id: owner.id
        })
      })
  })
})
