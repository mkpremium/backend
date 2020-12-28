import { expect } from 'chai'
import { AssignFlipperToCallerService } from '../../../src/caller/service/assign-flipper-to-caller.service'
import { stub } from 'sinon'

describe('AssignFlipperToCallerService', () => {
  const testCallerId = 'test-caller-id'
  let service
  let scheduledCallsServiceStub

  beforeEach(() => {
    scheduledCallsServiceStub = {
      scheduledCallsFor: stub()
    }
    service = new AssignFlipperToCallerService(scheduledCallsServiceStub)
  })

  it('does not assign caller with scheduled calls', () => {
    scheduledCallsServiceStub.scheduledCallsFor.withArgs(testCallerId).resolves([{}])

    return expect(service.assign(testCallerId, 'test-flipper-id')).to.be.rejectedWith('scheduled calls')
  })

  it('does not assign caller working on a queue different that flipper', () => {
    scheduledCallsServiceStub.scheduledCallsFor.withArgs(testCallerId).resolves([])

    return expect(service.assign(testCallerId, 'test-flipper-id')).to.be.rejectedWith('queue mismatch')
  })
})
