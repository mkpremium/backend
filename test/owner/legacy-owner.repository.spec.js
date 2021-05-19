import { expect } from 'chai'
import { createOwner } from '../../test-e2e/helper/mother-of-objects'
import { createTestContainer } from '../create-test-container'

describe('LegacyOwnerRepository', () => {
  let legacyOwnerRepository, owner

  beforeEach(async () => {
    const container = await createTestContainer()
    owner = await createOwner(container, { status: undefined })
    legacyOwnerRepository = container.resolve('legacyOwnersRepository')
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
})
