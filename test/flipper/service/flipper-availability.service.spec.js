import { expect } from 'chai'
import { stub } from 'sinon'

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
    meetingsServiceStub.futureMeetingsFor.withArgs('test-flipper-id').resolves([{}])

    return service.unavailabilityForFlipper('test-flipper-id')
      .then(blockedAvailability => {
        expect(blockedAvailability).to.have.length(1)
      })
  })
})
