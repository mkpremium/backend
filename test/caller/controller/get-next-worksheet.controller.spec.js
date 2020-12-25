import { expect } from 'chai'
import { createGetNextCallerWorksheetController } from '../../../src/caller/controller/get-next-worksheet.controller'
import stub from 'sinon/lib/sinon/stub'
import { spy } from 'sinon'

describe('Get Next Caller Worksheet Controller', () => {
  it('gets next worksheet from caller assigned queue', async () => {
    const testCallerId = 'test-caller-id'
    const testCallerAssignedQueueId = 'test-caller-assigned-queue-id'
    const nextWorksheetInCallerAssignedQueue = {}
    const getNextWorksheetInQueueServiceMock = {
      nextWorksheetInQueueOfId: stub()
    }

    getNextWorksheetInQueueServiceMock.nextWorksheetInQueueOfId.withArgs(testCallerAssignedQueueId, testCallerId)
      .resolves(nextWorksheetInCallerAssignedQueue)

    const controller = createGetNextCallerWorksheetController({
      takeNextWorksheetInQueueService: getNextWorksheetInQueueServiceMock
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
})
