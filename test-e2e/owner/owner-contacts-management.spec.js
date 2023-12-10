import { expect } from 'chai'
import { createFlipper } from '../../test/common'
import {
  associateBuildingWithOwner,
  createBuilding,
  createOwner,
  createWorksheetForBuilding,
  testContactPhone,
  testPhoneContactId
} from '../helper/mother-of-objects'
import { authenticatedPost, authenticatedPut, initApplication } from '../helper/rest-api-helper'

describe('Building owner contacts management', () => {
  let app, businessUser, owner

  beforeEach(async () => {
    app = await initApplication()
    businessUser = await createFlipper()
    owner = await createOwner(app)

    // create worksheet to change status depending on owner status
    const building = await createBuilding(app, { owner })
    await createWorksheetForBuilding(app, building)
    await associateBuildingWithOwner(app, owner, building.id)
  })

  it('updates contact status', async () => {
    await authenticatedPut(`/owners/${owner.id}/contacts/${testPhoneContactId}/status`, businessUser, app, { status: 'BAD' })
      .then(async (response) => {
        expect(response.status).to.be.equal(204)
        const ownerRepository = app.locals.diContainer.resolve('ownersRepository')
        const savedOwner = await ownerRepository.get(owner.id)

        expect(savedOwner.person.contacts.length).to.be.equal(1)
        expect(savedOwner.person.contacts[ 0 ]).to.be.deep.equal({
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
        const ownerRepository = app.locals.diContainer.resolve('ownersRepository')
        const savedOwner = await ownerRepository.get(owner.id)

        expect(savedOwner.person.contacts.length).to.be.equal(2)
        expect(savedOwner.person.contacts[ 1 ]).to.include(contactInfoToAdd)
      })
  })

  it('list owners with matching phone number', async () => {
    await authenticatedPost(`/owners/search`, businessUser, app, { phoneNumber: testContactPhone })
      .then(async (response) => {
        expect(response.status).to.be.equal(200)

        expect(response.body).to.have.lengthOf(1)
        expect(response.body[0].id).to.equal(owner.id)
      })
  })
})
