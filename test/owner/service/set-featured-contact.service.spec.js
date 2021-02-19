import { SetOwnerFeaturedContactService } from '../../../src/owner/service/set-featured-contact.service'
import { stub } from 'sinon'
import { expect } from 'chai'
import { ownerBuilder } from '../owner.builder'

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

  it('sets featured contact object', () => {
    const testOwnerId = 'test-owner-id'
    const testPhoneId = 'test-phone-id'
    const testOwner = ownerBuilder().withPhoneContact(testPhoneId).build()
    ownersRepositoryStub.get.withArgs(testOwnerId).resolves(testOwner)

    return service.setFeaturedContact(testOwnerId, { phoneId: testPhoneId }).then(() => {
      expect(ownersRepositoryStub.save).to.have.been.calledWithMatch(
        o => o.id === testOwnerId && o.featuredContact.phoneId === testPhoneId
      )
    })
  })

  it('features email of given ID', () => {
    const testOwnerId = 'test-owner-id'
    const testEmailId = 'test-email-id'
    const testOwner = ownerBuilder().withEmailContact(testEmailId).build()
    ownersRepositoryStub.get.withArgs(testOwnerId).resolves(testOwner)

    return service.setFeaturedContact(testOwnerId, testEmailId).then(() => {
      expect(ownersRepositoryStub.save).to.have.been.calledWithMatch(
        o => o.id === testOwnerId && o.featuredContact.emailId === testEmailId
      )
    })
  })

  it('features phone of given ID', () => {
    const testOwnerId = 'test-owner-id'
    const testPhoneId = 'test-phone-id'
    const testOwner = ownerBuilder().withPhoneContact(testPhoneId).build()
    ownersRepositoryStub.get.withArgs(testOwnerId).resolves(testOwner)

    return service.setFeaturedContact(testOwnerId, testPhoneId).then(() => {
      expect(ownersRepositoryStub.save).to.have.been.calledWithMatch(
        o => o.id === testOwnerId && o.featuredContact.phoneId === testPhoneId
      )
    })
  })
})
