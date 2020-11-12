import { expect } from 'chai'
import { fake } from 'sinon'
import { FeaturedOwnerService } from '../../src/featuredOwner/FeaturedOwnerService'

describe('FeaturedOwnerService', () => {
  it('stores featured owner for a building and a property manager', async () => {
    const propertyManagerRepository = {
      setBuildingFeaturedOwner: fake.returns(Promise.resolve())
    }

    const service = new FeaturedOwnerService(propertyManagerRepository)

    await service.setBuildingFeaturedOwner(
      'building-id',
      'owner-id'
    )

    expect(propertyManagerRepository.setBuildingFeaturedOwner)
      .to.have.been.calledWith('building-id', 'owner-id')
  })
})
