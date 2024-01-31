import { expect } from 'chai'
import { spy, stub } from 'sinon'
import { createTakeWorksheetInQueueController } from '../../../src/caller/controller/take-worksheet-in-queue.controller'

describe('Take Worksheet In Queue Controller', function () {
  it('take worksheet in caller assigned queue', async function () {
    const testCallerId = 'test-caller-id'
    const testCallerAssignedQueueId = 'test-caller-assigned-queue-id'
    const testWorksheetId = 'test-worksheet-id'
    const worksheetQueueActionsServiceMock = {
      takeWorksheetInQueue: stub()
    }

    const controller = createTakeWorksheetInQueueController({
      takeWorksheetService: worksheetQueueActionsServiceMock
    })

    const testRequest = {
      user: {
        id: testCallerId,
        operator: {
          profile: {
            queueId: testCallerAssignedQueueId
          }
        }
      },
      params: {
        worksheetId: testWorksheetId
      }
    }
    const responseSpy = {
      json: spy()
    }

    const takenWorksheet = { id: 'taken-worksheet' }
    worksheetQueueActionsServiceMock.takeWorksheetInQueue.withArgs(
      testCallerAssignedQueueId,
      testWorksheetId,
      testCallerId
    ).resolves(takenWorksheet)

    return controller(testRequest, responseSpy).then(() => {
      expect(responseSpy.json).to.have.been.calledWith(takenWorksheet)
    })
  })
})
