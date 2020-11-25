import { WorksheetQueueActionsService } from '../../../src/worksheet/service/worksheet-queue-actions-service'
import { stub } from 'sinon'
import { Worksheet, WorksheetQueue } from '../../../src/worksheet/worksheet'
import spy from 'sinon/lib/sinon/spy'
import { expect } from 'chai'

describe('WorksheetQueueActionsService', () => {
  const testQueueId = 'test-queue-id'
  const testWorksheetId = 'test-worksheet-id'
  const testUserId = 'test-user-id'

  let service
  let queueRepositoryMock
  let worksheetRepositoryMock

  beforeEach(() => {
    queueRepositoryMock = {
      get: stub(),
      save: spy()
    }
    worksheetRepositoryMock = {
      get: stub(),
      getForCallcenterView: stub()
    }

    service = new WorksheetQueueActionsService(
      queueRepositoryMock,
      worksheetRepositoryMock
    )
  })

  describe('takeWorksheetInQueue', () => {
    const testWorksheet = Worksheet({ id: testWorksheetId })
    const testWorksheetForCallcenterView = { id: testWorksheetId, relatedBuildings: [], relatedOwners: [] }
    const emptyQueue = WorksheetQueue({
      id: testQueueId,
      name: 'test queue',
      source: {
        province: 'test'
      },
      worksheets: []
    })

    beforeEach(() => {
      queueRepositoryMock.get.withArgs(testQueueId).resolves(emptyQueue)
      worksheetRepositoryMock.get.withArgs(testWorksheetId).resolves(testWorksheet)
      worksheetRepositoryMock.getForCallcenterView.withArgs(testWorksheetId).resolves(testWorksheetForCallcenterView)
    })

    it('takes worksheet into queue', async () => {
      const takenWorksheet = await service.takeWorksheetInQueue(testQueueId, testWorksheetId, testUserId)

      expect(queueRepositoryMock.save).to.have.been.calledOnce
      expect(queueRepositoryMock.save.firstCall.args[ 0 ].worksheets).to.have.lengthOf(1)
      expect(queueRepositoryMock.save.firstCall.args[ 0 ].worksheets[ 0 ].worksheetId).to.equal(testWorksheetId)
      expect(queueRepositoryMock.save.firstCall.args[ 0 ].worksheets[ 0 ].operatorId).to.equal(testUserId)
      expect(queueRepositoryMock.save.firstCall.args[ 0 ].worksheets[ 0 ].status).to.equal('OPENED')

      expect(takenWorksheet).to.equal(testWorksheetForCallcenterView)
    })
  })
})
