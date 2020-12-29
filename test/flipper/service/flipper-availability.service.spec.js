import { expect } from 'chai'
import { stub } from 'sinon'
import { Meeting } from '../../../src/scheduled-events/domain/meeting'
import moment from 'moment'

const { FlipperAvailabilityService } = require('../../../src/flipper/service/flipper-availability.service')

describe('FlipperAvailabilityService', () => {
  let service
  let meetingsServiceStub

  beforeEach(() => {
    meetingsServiceStub = {
      futureMeetingsFor: stub()
    }
    service = new FlipperAvailabilityService({ meetingsService: meetingsServiceStub })
  })

  it('returns meetings as a one hour blocked availability', () => {
    const testMeeting = Meeting({
      id: 'test-meeting-id',
      buildingId: 'test-building-id',
      withAgentOfId: 'test-flipper-id',
      meetingAt: moment()
    })
    meetingsServiceStub.futureMeetingsFor.withArgs('test-flipper-id').resolves([ testMeeting ])

    return service.unavailabilityForFlipper('test-flipper-id')
      .then(blockedAvailability => {
        expect(blockedAvailability).to.have.length(1)
        expect(blockedAvailability[0].startsAt).to.be.equal(testMeeting.meetingAt)
        expect(blockedAvailability[0].endsAt).to.satisfies(m => testMeeting.meetingAt.add(1, 'hour').isSame(m, 'minute'))
      })
  })
})
