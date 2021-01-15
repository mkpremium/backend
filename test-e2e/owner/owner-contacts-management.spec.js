import { expect } from 'chai'
import { operatorCreateBusiness } from '../../test/common'
import { createOwner, testContactPhone, testPhoneContactId } from '../helper/mother-of-objects'
import { authenticatedGet, authenticatedPost, authenticatedPut, initApplication } from '../helper/rest-api-helper'

describe('Building owner contacts management', () => {
  let app, businessUser, owner

  beforeEach(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
    owner = await createOwner(app)
  })

  it('updates contact status', async () => {
    await authenticatedPut(`/owners/${owner.id}/contacts/${testPhoneContactId}/status`, businessUser, app, { status: 'BAD' })
      .then(async (response) => {
        expect(response.status).to.be.equal(204)
        const ownerRepository = app.locals.diContainer.resolve('legacyOwnersRepository')
        const savedOwner = await ownerRepository.findById(owner.id)

        expect(savedOwner.person.contacts.length).to.be.equal(1)
        expect(savedOwner.person.contacts[0]).to.be.deep.equal({
          id: testPhoneContactId,
          note: null,
          type: 'TELEFONO',
          status: 'BAD',
          value: testContactPhone
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
        const { ownerRepository } = app.locals.awilixContainer.resolve('legacyOwnersRepository')
        const savedOwner = await ownerRepository.findById(owner.id)

        expect(savedOwner.person.contacts.length).to.be.equal(2)
        expect(savedOwner.person.contacts[1]).to.include(contactInfoToAdd)
      })
  })

  it('list owners with matching phone number', async () => {
    await authenticatedGet(`/owners?contactNumber=${testContactPhone}`, businessUser, app)
      .then(async (response) => {
        expect(response.status).to.be.equal(200)

        expect(response.body.results).to.have.lengthOf(1)
        expect(response.body.results[0]).to.include({
          id: owner.id
        })
      })
  })
})
