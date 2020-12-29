import { createFlipperAvailabilityController } from '../../../src/flipper/controller/flipper-availability.controller'
import { spy, stub } from 'sinon'
import { expect } from 'chai'

describe('Flipper Availability Controller', () => {
  it('returns flipper availability from service', () => {
    const flipperAvailability = []
    const flipperAvailabilityServiceStub = { unavailabilityForFlipper: stub() }
    flipperAvailabilityServiceStub.unavailabilityForFlipper.withArgs('test-flipper-id').resolves(flipperAvailability)

    const controller = createFlipperAvailabilityController({
      flipperAvailabilityService: flipperAvailabilityServiceStub })

    const testRequest = { user: { flipperId: 'test-flipper-id' } }
    const testResponse = { json: spy() }
    return controller(testRequest, testResponse).then(() => {
      expect(testResponse.json).to.have.been.calledWith(flipperAvailability)
    })
  })
})
