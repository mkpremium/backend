import { expect } from 'chai'
import { AssignFlipperToCallerService } from '../../../src/caller/service/assign-flipper-to-caller.service'
import { spy, stub, match } from 'sinon'

describe('AssignFlipperToCallerService', () => {
  const testCallerId = 'test-caller-id'
  const testCaller = {
    id: testCallerId,
    username: 'testcaller',
    password: '',
    profile: {
      firstName: 'test',
      lastName: 'caller',
      queueId: 'test-queue-1'
    }
  }
  const testFlipperId = 'test-flipper-id'
  const testFlipper = {
    id: testFlipperId,
    username: 'testflipper',
    password: '',
    profile: {
      firstName: 'test',
      lastName: 'flipper',
      queueId: 'test-queue-1'
    }
  }
  let service
  let scheduledCallsServiceStub
  let usersRepositoryStub

  beforeEach(() => {
    scheduledCallsServiceStub = {
      scheduledCallsFor: stub()
    }
    usersRepositoryStub = {
      get: stub(),
      save: spy()
    }
    usersRepositoryStub.get.withArgs(testCallerId).resolves(testCaller)
    usersRepositoryStub.get.withArgs(testFlipperId).resolves(testFlipper)

    service = new AssignFlipperToCallerService(scheduledCallsServiceStub, usersRepositoryStub)
  })

  it('does not assign caller with scheduled calls', () => {
    scheduledCallsServiceStub.scheduledCallsFor.withArgs(testCallerId).resolves([ {} ])

    return expect(service.assign(testCallerId, testFlipperId)).to.be.rejectedWith('scheduled calls')
  })

  it('does not assign caller working on a queue different that flipper', () => {
    usersRepositoryStub.get.withArgs(testCallerId).resolves({
      ...testCaller,
      profile: {
        queueId: 'test-queue-2'
      }
    })
    scheduledCallsServiceStub.scheduledCallsFor.withArgs(testCallerId).resolves([])

    return expect(service.assign(testCallerId, testFlipperId)).to.be.rejectedWith('queues mismatch')
  })

  it('assigns caller to flipper', () => {
    scheduledCallsServiceStub.scheduledCallsFor.withArgs(testCallerId).resolves([])

    return service.assign(testCallerId, testFlipperId)
      .then(() => {
        expect(usersRepositoryStub.save)
          .to.have.been.calledWithMatch(match(c => c.id === testCallerId && c.flipperId === testFlipperId))
      })
  })
})
