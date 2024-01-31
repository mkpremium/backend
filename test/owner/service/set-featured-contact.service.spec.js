import { SetOwnerFeaturedContactService } from '../../../src/owner/service/set-featured-contact.service'
import { stub } from 'sinon'
import { expect } from 'chai'
import { ownerBuilder } from '../owner.builder'

describe('SetOwnerFeaturedContactService', function () {
  let service
  let ownersRepositoryStub

  beforeEach(function () {
    ownersRepositoryStub = {
      get: stub(),
      save: stub().resolves()
    }
    service = new SetOwnerFeaturedContactService(ownersRepositoryStub)
  })

  it('sets featured contact object', function () {
    const testPhoneId = 'test-phone-id'
    const testOwner = ownerBuilder().withPhoneContact(testPhoneId).build()
    ownersRepositoryStub.get.withArgs(testOwner.id).resolves(testOwner)

    return service.setFeaturedContact(testOwner.id, { phoneId: testPhoneId }).then(() => {
      expect(ownersRepositoryStub.save).to.have.been.calledWithMatch(
        o => o.id === testOwner.id && o.featuredContact.phoneId === testPhoneId
      )
    })
  })

  it('features email of given ID', function () {
    const testEmailId = 'test-email-id'
    const testOwner = ownerBuilder().withEmailContact(testEmailId).build()
    ownersRepositoryStub.get.withArgs(testOwner.id).resolves(testOwner)

    return service.setFeaturedContact(testOwner.id, testEmailId).then(() => {
      expect(ownersRepositoryStub.save).to.have.been.calledWithMatch(
        o => o.id === testOwner.id && o.featuredContact.emailId === testEmailId
      )
    })
  })

  it('features phone of given ID', function () {
    const testPhoneId = 'test-phone-id'
    const testOwner = ownerBuilder().withPhoneContact(testPhoneId).build()
    ownersRepositoryStub.get.withArgs(testOwner.id).resolves(testOwner)

    return service.setFeaturedContact(testOwner.id, testPhoneId).then(() => {
      expect(ownersRepositoryStub.save).to.have.been.calledWithMatch(
        o => o.id === testOwner.id && o.featuredContact.phoneId === testPhoneId
      )
    })
  })
})
