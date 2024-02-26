import { TakeNextWorksheetService } from '../../../src/worksheet/service/take-next-worksheet.service'
import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { WorksheetNotFound } from '../../../src/worksheet/repository/worksheet.repository'
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
  let eventBusSpy

  beforeEach(() => {
    takeWorksheetServiceMock = { takeWorksheetInQueue: stub().resolves({ id: 'test-next-worksheet-id' }) }
    worksheetsRepositoryMock = { nextAvailableWorksheetInSource: stub() }
    worksheetsQueueRepositoryMock = { get: stub() }
    eventBusSpy = { publish: spy() }

    service = new TakeNextWorksheetService(
      takeWorksheetServiceMock,
      worksheetsRepositoryMock,
      worksheetsQueueRepositoryMock,
      eventBusSpy
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

  it('gets another worksheet when next one is not found', async () => {
    worksheetsRepositoryMock.nextAvailableWorksheetInSource.withArgs(testQueue.source)
      .rejects(new WorksheetNotFound('worksheet-without-valid-owners-id'))
    const testNextWorksheet = worksheetBuilder().build()
    worksheetsRepositoryMock.nextAvailableWorksheetInSource.withArgs(testQueue.source, 'worksheet-without-valid-owners-id')
      .resolves(testNextWorksheet)

    await service.nextWorksheetInQueue(testQueue, testUserId)

    expect(takeWorksheetServiceMock.takeWorksheetInQueue).to.have.been
      .calledWith(testQueue.id, testNextWorksheet.id, testUserId)
    expect(eventBusSpy.publish).to.have.been.calledWith({
      name: 'worksheet.invalid_worksheet_found',
      worksheetId: 'worksheet-without-valid-owners-id'
    })
  })

  it('publishes event', async () => {
    const testNextWorksheet = worksheetBuilder().build()
    worksheetsRepositoryMock.nextAvailableWorksheetInSource.resolves(testNextWorksheet)

    await service.nextWorksheetInQueue(testQueue, testUserId)

    expect(eventBusSpy.publish).to.have.been.calledWith({
      name: 'worksheet.next_in_queue_taken',
      by: testUserId,
      source: testQueue.source,
      worksheetId: 'test-next-worksheet-id',
      queueId: testQueue.id
    })
  })
})
