import { expect } from 'chai'
import { createAssignedFlipperBlockedAvailabilityController } from '../../../src/caller/controller/assigned-flipper-blocked-availability.controller'
import { spy, stub } from 'sinon'

describe('Assigned Flipper Blocked Availability Controller', function () {
  it('returns client error when caller does not have a flipper assigned', function () {
    const controller = createAssignedFlipperBlockedAvailabilityController({})
    const testRequest = {
      user: {
        flipperId: null
      }
    }
    const testResponse = { send: spy(), status: spy() }

    return controller(testRequest, testResponse).then(() => {
      expect(testResponse.status).to.have.been.calledWith(400)
      expect(testResponse.send).to.have.been.called
    })
  })

  it('returns assigned flipper blocked availability', function () {
    const blockedAvailabilityForFlipperStub = stub()
    const flipperBlockedAvailabilityFromService = []
    const testAssignedFlipperId = 'test-assigned-flipper-id'
    blockedAvailabilityForFlipperStub.withArgs(testAssignedFlipperId).resolves(flipperBlockedAvailabilityFromService)

    const controller = createAssignedFlipperBlockedAvailabilityController({
      flipperAvailabilityService: {
        blockedAvailabilityForFlipper: blockedAvailabilityForFlipperStub
      }
    })

    const testRequest = {
      user: {
        flipperId: testAssignedFlipperId
      }
    }
    const testResponse = { json: spy() }

    return controller(testRequest, testResponse).then(() => {
      expect(testResponse.json).to.have.been.calledWith(flipperBlockedAvailabilityFromService)
    })
  })
})
