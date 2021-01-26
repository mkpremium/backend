import { createScheduledCallListener } from '../../../src/building/event-listener/call-scheduled.listener'
import { expect } from 'chai'
import { stub } from 'sinon'

describe('call-scheduled.listener', () => {
  it('sets owner with call scheduled as featured owner', () => {
    const featuredOwnerServiceStub = {
      setBuildingFeaturedOwner: stub()
    }
    const listener = createScheduledCallListener({ featuredOwnerService: featuredOwnerServiceStub })

    featuredOwnerServiceStub.setBuildingFeaturedOwner.resolves()
    return listener({ buildingId: 'test-building-id', ownerId: 'test-owner-id' })
      .then(() => {
        expect(featuredOwnerServiceStub.setBuildingFeaturedOwner)
          .to.have.been.calledWith('test-building-id', 'test-owner-id')
      })
  })
})
