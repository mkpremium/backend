import { expect } from 'chai'
import { fake } from 'sinon'
import { FeaturedOwnerService } from '../../src/featuredOwner/FeaturedOwnerService'

describe('FeaturedOwnerService', () => {
  it('stores featured owner for a building and a property manager', async () => {
    const propertyManagerRepository = {
      setFeaturedOwnerForBuildingAndPropertyManager: fake.returns(Promise.resolve())
    }

    const service = new FeaturedOwnerService(propertyManagerRepository)

    const result = await service.setFeaturedOwnerForBuildingAndPropertyManager(
      'property-agent-id',
      'building-id',
      'owner-id'
    )

    expect(propertyManagerRepository.setFeaturedOwnerForBuildingAndPropertyManager)
      .to.have.been.calledWith('property-agent-id', 'building-id', 'owner-id')
    expect(result).to.be.true
  })
})
