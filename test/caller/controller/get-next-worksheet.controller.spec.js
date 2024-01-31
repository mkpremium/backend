import { expect } from 'chai'
import { createGetNextCallerWorksheetController } from '../../../src/caller/controller/get-next-worksheet.controller'
import { spy, stub } from 'sinon'

describe('Get Next Caller Worksheet Controller', function () {
  it('gets next worksheet from caller assigned queue', async function () {
    const testCallerId = 'test-caller-id'
    const testCallerAssignedQueueId = 'test-caller-assigned-queue-id'
    const nextWorksheetInCallerAssignedQueue = {}
    const getNextWorksheetInQueueServiceMock = {
      nextWorksheetInQueueOfId: stub()
    }

    getNextWorksheetInQueueServiceMock.nextWorksheetInQueueOfId.withArgs(testCallerAssignedQueueId, testCallerId)
      .resolves(nextWorksheetInCallerAssignedQueue)

    const controller = createGetNextCallerWorksheetController({
      takeNextWorksheetService: getNextWorksheetInQueueServiceMock
    })

    const testRequest = {
      user: {
        id: testCallerId,
        operator: {
          profile: {
            queueId: testCallerAssignedQueueId
          }
        }
      }
    }
    const responseSpy = {
      json: spy()
    }

    return controller(testRequest, responseSpy).then(() => {
      expect(responseSpy.json).to.have.been.calledWith(nextWorksheetInCallerAssignedQueue)
    })
  })

  it('rejects requests for users without a queue assigned', function () {
    const controller = createGetNextCallerWorksheetController({})

    const testRequest = {
      user: {
        operator: {
          profile: {
            queueId: undefined
          }
        }
      }
    }

    return expect(controller(testRequest)).to.have.been.rejected
  })
})
