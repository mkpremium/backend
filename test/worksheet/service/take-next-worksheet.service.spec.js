import { TakeNextWorksheetService } from '../../../src/worksheet/service/take-next-worksheet.service'
import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { Worksheet, WorksheetQueue } from '../../../src/worksheet/domain/worksheet'

describe('TakeNextWorksheetService', () => {
  let service
  let takeWorksheetServiceMock
  let worksheetsRepositoryMock

  beforeEach(() => {
    takeWorksheetServiceMock = {
      takeWorksheetInQueue: spy()
    }
    worksheetsRepositoryMock = {
      nextAvailableWorksheetInSource: stub()
    }
    service = new TakeNextWorksheetService(takeWorksheetServiceMock, worksheetsRepositoryMock)
  })

  it('takes next worksheet from source', async () => {
    const testQueue = WorksheetQueue({
      id: 'test-queue-id',
      name: 'test queue',
      source: {
        province: 'test province'
      }
    })
    const testNextWorksheet = Worksheet({
      id: 'test-next-worksheet-id'
    })
    worksheetsRepositoryMock.nextAvailableWorksheetInSource.withArgs(testQueue.source)
      .resolves(testNextWorksheet)

    await service.nextWorksheetInQueue(testQueue, 'test-user-id')

    expect(takeWorksheetServiceMock.takeWorksheetInQueue).to.have.been
      .calledWith(testQueue.id, testNextWorksheet.id, 'test-user-id')
  })
})
