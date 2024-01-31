import { setFeaturedOwnerAndContactFromMeetingListener } from '../../../src/building/event-listener/set-featured-owner-and-contact-from-meeting.listener'
import { expect } from 'chai'
import { stub } from 'sinon'

const testBuildingId = 'test-building-id'
const testOwnerId = 'test-owner-id'
const testContactId = 'test-contact-id'
describe('set-featured-owner-and-contact-from-meeting.listener', function () {
  let listener
  let featuredOwnerServiceStub
  let setOwnerFeaturedContactServiceStub
  let result

  beforeEach(function () {
    featuredOwnerServiceStub = {
      setBuildingFeaturedOwner: stub().resolves()
    }
    setOwnerFeaturedContactServiceStub = {
      setFeaturedContact: stub().resolves()
    }
    listener = setFeaturedOwnerAndContactFromMeetingListener({
      featuredOwnerService: featuredOwnerServiceStub,
      setOwnerFeaturedContactService: setOwnerFeaturedContactServiceStub
    })
    result = listener({ ownerId: testOwnerId, buildingId: testBuildingId, contactId: testContactId })
  })

  it('sets meeting owner as building featured owner', function () {
    return result.then(
      () => expect(featuredOwnerServiceStub.setBuildingFeaturedOwner).to.have.been.calledWith(testBuildingId, testOwnerId)
    )
  })

  it('marks contact as featured', function () {
    return result.then(
      () => expect(setOwnerFeaturedContactServiceStub.setFeaturedContact).to.have.been.calledWith(testOwnerId, testContactId)
    )
  })
})
