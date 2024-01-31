import { expect } from 'chai'
import { stub } from 'sinon'
import { Meeting } from '../../../src/scheduled-events/domain/meeting'
import { FlipperAvailabilityService } from '../../../src/flipper/service/flipper-availability.service'
import moment from 'moment'

describe('FlipperAvailabilityService', function () {
  /** @var {FlipperAvailabilityService} service **/
  let service
  let meetingsServiceStub
  let userBlockedAvailabilityServiceStub

  beforeEach(function () {
    meetingsServiceStub = {
      futureMeetingsFor: stub()
    }
    meetingsServiceStub.futureMeetingsFor.withArgs('test-flipper-id').resolves([])
    userBlockedAvailabilityServiceStub = {
      blockedAvailabilityForUser: stub()
    }
    userBlockedAvailabilityServiceStub.blockedAvailabilityForUser.withArgs('test-flipper-id').resolves([])

    service = new FlipperAvailabilityService({
      meetingsService: meetingsServiceStub,
      userBlockedAvailabilityService: userBlockedAvailabilityServiceStub
    })
  })

  it('returns meetings as a one hour blocked availability', function () {
    const testMeeting = Meeting({
      id: 'test-meeting-id',
      buildingId: 'test-building-id',
      withAgentOfId: 'test-flipper-id',
      meetingAt: moment()
    })
    meetingsServiceStub.futureMeetingsFor.withArgs('test-flipper-id').resolves([testMeeting])

    return service.blockedAvailabilityForFlipper('test-flipper-id')
      .then(blockedAvailability => {
        expect(blockedAvailability).to.have.length(1)
        expect(blockedAvailability[0].type).to.be.equal('MEETING')
        expect(blockedAvailability[0].meetingId).to.be.equal(testMeeting.id)
        expect(blockedAvailability[0].buildingId).to.be.equal(testMeeting.buildingId)
        expect(blockedAvailability[0].startsAt).to.be.equal(testMeeting.meetingAt)
        expect(blockedAvailability[0].endsAt).to.satisfies(m => testMeeting.meetingAt.add(1, 'hour').isSame(m, 'minute'))
      })
  })

  it('returns restrictions as blocked availability', function () {
    const startsAt = moment()
    const testUserBlockedAvailability = {
      startsAt,
      endsAt: startsAt.clone().add(1, 'hour')
    }
    userBlockedAvailabilityServiceStub.blockedAvailabilityForUser.withArgs('test-flipper-id').resolves([testUserBlockedAvailability])

    return service.blockedAvailabilityForFlipper('test-flipper-id')
      .then(blockedAvailability => {
        expect(blockedAvailability).to.have.length(1)
        expect(blockedAvailability[0].type).to.be.equal('BLOCKED-AVAILABILITY')
        expect(blockedAvailability[0].startsAt).to.be.equal(testUserBlockedAvailability.startsAt)
        expect(blockedAvailability[0].endsAt).to.be.equal(testUserBlockedAvailability.endsAt)
      })
  })

  it('doesnt return passed restrictions as blocked availability', function () {
    const startsAt = moment().add(-1, 'day')
    const testUserBlockedAvailability = {
      startsAt,
      endsAt: startsAt.clone().add(1, 'hour')
    }
    userBlockedAvailabilityServiceStub.blockedAvailabilityForUser.withArgs('test-flipper-id').resolves([testUserBlockedAvailability])

    return service.blockedAvailabilityForFlipper('test-flipper-id')
      .then(blockedAvailability => {
        expect(blockedAvailability).to.have.length(0)
      })
  })
})
