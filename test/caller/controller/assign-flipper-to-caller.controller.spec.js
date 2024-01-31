import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { createAssignFlipperToCallerController } from '../../../src/caller/controller/assign-flipper-to-caller.controller'
import { CallerToFlipperAssignationRejected } from '../../../src/caller/service/caller-to-flipper-assignation-rejected.error'

describe('Assign Flipper To Caller Controller', function () {
  const testCallerId = 'test-caller-id'
  const testFlipperId = 'test-flipper-id'
  const testRequest = {
    params: {
      flipperId: testFlipperId,
      callerId: testCallerId
    }
  }

  it('returns OK on a successful assignation', function () {
    const assignFlipperStub = stub()
    const controller = createAssignFlipperToCallerController({
      assignFlipperToCallerService: { assign: assignFlipperStub }
    })
    assignFlipperStub.resolves()

    const testResponse = { status: stub().returnsThis(), json: spy() }

    return controller(testRequest, testResponse).then(() => {
      expect(testResponse.status).to.have.been.calledWith(200)
      expect(testResponse.json).to.have.been.called
    })
  })

  it('returns error when caller has pending scheduled calls', function () {
    const assignFlipperStub = stub()
    const controller = createAssignFlipperToCallerController({
      assignFlipperToCallerService: { assign: assignFlipperStub }
    })
    assignFlipperStub.withArgs(testCallerId, testFlipperId)
      .rejects(new CallerToFlipperAssignationRejected('rejection reason'))

    const testResponse = { status: stub().returnsThis(), send: spy() }

    return controller(testRequest, testResponse).then(() => {
      expect(testResponse.status).to.have.been.calledWith(400)
      expect(testResponse.send).to.have.been.calledWith('rejection reason')
    })
  })
})
