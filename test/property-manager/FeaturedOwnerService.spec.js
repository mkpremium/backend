import { expect } from 'chai'
import { fake } from 'sinon'
import { FeaturedOwnerService } from '../../src/property-manager/FeaturedOwnerService'

describe('FeaturedOwnerService', () => {
  it('stores featured owner for a building and a property manager', async () => {
    const propertyManagerRepository = {
      setFeaturedOwnerForBuildingAndPropertyManager: fake.returns(Promise.resolve())
    }
    propertyManagerRepository.setFeaturedOwnerForBuildingAndPropertyManager('property-agent-id', 'building-id', 'owner-id')

    const service = new FeaturedOwnerService(propertyManagerRepository)

    const result = await service.setFeaturedOwnerForBuildingAndPropertyManager(
      'property-agent-id',
      'building-id',
      'owner-id'
    )

    expect(result).to.be.true
  })
})
