import { expect } from 'chai'
import { stub } from 'sinon'
import { Meeting } from '../../../src/scheduled-events/domain/meeting'
import moment from 'moment'

const { FlipperAvailabilityService } = require('../../../src/flipper/service/flipper-availability.service')

describe('FlipperAvailabilityService', () => {
  /** @var {FlipperAvailabilityService} service **/
  let service
  let meetingsServiceStub
  let userBlockedAvailabilityServiceStub

  beforeEach(() => {
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

  it('returns meetings as a one hour blocked availability', () => {
    const testMeeting = Meeting({
      id: 'test-meeting-id',
      buildingId: 'test-building-id',
      withAgentOfId: 'test-flipper-id',
      meetingAt: moment()
    })
    meetingsServiceStub.futureMeetingsFor.withArgs('test-flipper-id').resolves([ testMeeting ])

    return service.blockedAvailabilityForFlipper('test-flipper-id')
      .then(blockedAvailability => {
        expect(blockedAvailability).to.have.length(1)
        expect(blockedAvailability[ 0 ].type).to.be.equal('MEETING')
        expect(blockedAvailability[ 0 ].meetingId).to.be.equal(testMeeting.id)
        expect(blockedAvailability[ 0 ].buildingId).to.be.equal(testMeeting.buildingId)
        expect(blockedAvailability[ 0 ].startsAt).to.be.equal(testMeeting.meetingAt)
        expect(blockedAvailability[ 0 ].endsAt).to.satisfies(m => testMeeting.meetingAt.add(1, 'hour').isSame(m, 'minute'))
      })
  })

  it('returns restrictions as blocked availability', () => {
    const startsAt = moment()
    const testUserBlockedAvailability = {
      startsAt: startsAt,
      endsAt: startsAt.clone().add(1, 'hour')
    }
    userBlockedAvailabilityServiceStub.blockedAvailabilityForUser.withArgs('test-flipper-id').resolves([ testUserBlockedAvailability ])

    return service.blockedAvailabilityForFlipper('test-flipper-id')
      .then(blockedAvailability => {
        expect(blockedAvailability).to.have.length(1)
        expect(blockedAvailability[ 0 ].type).to.be.equal('BLOCKED-AVAILABILITY')
        expect(blockedAvailability[ 0 ].startsAt).to.be.equal(testUserBlockedAvailability.startsAt)
        expect(blockedAvailability[ 0 ].endsAt).to.be.equal(testUserBlockedAvailability.endsAt)
      })
  })
})
