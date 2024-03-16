import { TakeNextWorksheetService } from '../../../src/worksheet/service/take-next-worksheet.service'
import { stub } from 'sinon'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'
import { WorksheetQueue } from '../../../src/worksheet/domain/queue'

const testUserId = 'test-user-id'
describe('TakeNextWorksheetService', () => {
  const testQueue = WorksheetQueue({
    id: 'test-queue-id',
    name: 'test queue',
    worksheets: [],
    source: {
      province: 'test province'
    }
  })
  let service: TakeNextWorksheetService
  let takeWorksheetServiceMock
  let worksheetsRepositoryMock
  let worksheetsQueueRepositoryMock

  beforeEach(() => {
    takeWorksheetServiceMock = { takeWorksheetInQueue: stub().resolves({ id: 'test-next-worksheet-id' }) }
    worksheetsRepositoryMock = { nextAvailableWorksheetInSource: stub() }
    worksheetsQueueRepositoryMock = { get: stub() }

    service = new TakeNextWorksheetService(
      takeWorksheetServiceMock,
      worksheetsRepositoryMock,
      worksheetsQueueRepositoryMock
    )
  })

  it('takes next worksheet from source', async () => {
    const testNextWorksheet = worksheetBuilder().build()
    worksheetsRepositoryMock.nextAvailableWorksheetInSource.withArgs(testQueue.source)
      .resolves(testNextWorksheet)

    await service.nextWorksheetInQueue(testQueue, testUserId)

    expect(takeWorksheetServiceMock.takeWorksheetInQueue).to.have.been
      .calledWith(testQueue.id, testNextWorksheet.id, testUserId)
  })

  it('takes next worksheet in queue by its id', async () => {
    worksheetsRepositoryMock.nextAvailableWorksheetInSource.withArgs(testQueue.source).resolves(null)
    worksheetsQueueRepositoryMock.get.withArgs(testQueue.id).resolves(testQueue)

    await service.nextWorksheetInQueueOfId(testQueue.id, testUserId)

    expect(worksheetsRepositoryMock.nextAvailableWorksheetInSource).to.have.been.calledWith(testQueue.source)
  })
})
