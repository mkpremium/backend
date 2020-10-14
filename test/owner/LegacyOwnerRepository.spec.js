import { OwnerStatus } from '../../src/types/enums'
import { createOwner, testPhoneContactId } from '../../test-e2e/helper/mother-of-objects'
import { initApplication } from '../../test-e2e/helper/rest-api-helper'
import { expect } from 'chai'

describe('LegacyOwnerRepository', () => {
  let app, legacyOwnerRepository, owner

  beforeEach(async () => {
    app = await initApplication()
    owner = await createOwner(app, { status: undefined })
    legacyOwnerRepository = app.locals.legacyDependenciesContainer.ownerRepository
  })

  describe('findByIdWithIncludes', () => {
    it('finds owner without includes', async () => {
      const [ foundOwner ] = await legacyOwnerRepository.findByIdWithIncludes(owner.id)

      expect(foundOwner.id).to.be.equal(owner.id)
    })

    it('finds owner including empty building', async () => {
      const [ foundOwner ] = await legacyOwnerRepository.findByIdWithIncludes(owner.id, [ 'building' ])

      expect(foundOwner.id).to.be.equal(owner.id)
    })
  })

  describe('changeContactStatus', () => {
    it('marks owner as VERIFIED when at least one at least one contact is GOOD', async () => {
      expect(owner.status).to.be.equal(OwnerStatus.NON_VERIFIED)

      const updatedOwner = await legacyOwnerRepository.changeContactStatus(owner.id, testPhoneContactId, 'GOOD')
      expect(updatedOwner.status).to.be.equal(OwnerStatus.VERIFIED)
    })

    it('marks owner as WITHOUT_CONTACT when all contacts are BAD', async () => {
      expect(owner.status).to.be.equal(OwnerStatus.NON_VERIFIED)

      const updatedOwner = await legacyOwnerRepository.changeContactStatus(owner.id, testPhoneContactId, 'BAD')
      expect(updatedOwner.status).to.be.equal(OwnerStatus.WITHOUT_CONTACT)
    })
  })
})
