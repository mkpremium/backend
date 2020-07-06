import { createOwner } from '../../test-e2e/helper/mother-of-objects'
import { initApplication } from '../../test-e2e/helper/rest-api-helper'
import { expect } from 'chai'

describe('LegacyOwnerRepository', () => {
  let app, legacyOwnerRepository

  beforeEach(async () => {
    app = await initApplication()
    legacyOwnerRepository = app.locals.legacyDependenciesContainer.ownerRepository
  })

  describe('findByIdWithIncludes', () => {
    it('finds owner without includes', async () => {
      const owner = await createOwner(app)

      const [ foundOwner ] = await legacyOwnerRepository.findByIdWithIncludes(owner.id)

      expect(foundOwner.id).to.be.equal(owner.id)
    })

    it('finds owner including empty building', async () => {
      const owner = await createOwner(app)

      const [ foundOwner ] = await legacyOwnerRepository.findByIdWithIncludes(owner.id, ['building'])

      expect(foundOwner.id).to.be.equal(owner.id)
    })
  })
})
