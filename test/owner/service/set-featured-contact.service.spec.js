import { SetOwnerFeaturedContactService } from '../../../src/owner/service/set-featured-contact.service'
import { Owner } from '../../../src/owner/owner'
import { stub } from 'sinon'
import { expect } from 'chai'

const ownerPrototype = { id: 'test-owner-id' }
const ownerBuilder = (overwrites = {}) => {
  return {
    build () {
      return Owner({ ...ownerPrototype, overwrites })
    }
  }
}

describe('SetOwnerFeaturedContactService', () => {
  let service
  let ownersRepositoryStub

  beforeEach(() => {
    ownersRepositoryStub = {
      get: stub(),
      save: stub().resolves()
    }
    service = new SetOwnerFeaturedContactService(ownersRepositoryStub)
  })

  it('sets featured contact', () => {
    const testOwnerId = 'test-owner-id'
    const testOwner = ownerBuilder().build()
    ownersRepositoryStub.get.withArgs(testOwnerId).resolves(testOwner)

    return service.setFeaturedContact(testOwnerId, { phoneId: 'test-phone-id' }).then(() => {
      expect(ownersRepositoryStub.save).to.have.been.calledWithMatch(
        o => o.id === testOwnerId && o.featuredContact.phoneId === 'test-phone-id'
      )
    })
  })
})
