import { WorksheetQueue } from '../../../src/worksheet/domain/queue'
import { ReleaseUserExtraOpenedWorksheetsInQueueService } from '../../../src/worksheet/service/release-user-extra-opened-worksheets-in-queue.service'
import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { WorkSheetStatus } from '../../../src/worksheet/domain/worksheet'
import moment from 'moment'
import { QueueStatus } from '../../../src/worksheet/models/queue-item'
import { worksheetBuilder } from '../worksheet.builder'

describe('ReleaseUserOtherActiveWorksheetsInQueueService', () => {
  const testUserId = 'user-id'
  const testQueueId = 'queue-id'
  let service
  let worksheetQueueRepositoryMock
  let worksheetRepositoryMock

  beforeEach(() => {
    worksheetQueueRepositoryMock = {
      get: stub(),
      save: spy()
    }
    worksheetRepositoryMock = {
      get: stub(),
      save: stub(),
      patch: spy()
    }
    service = new ReleaseUserExtraOpenedWorksheetsInQueueService(
      worksheetQueueRepositoryMock,
      worksheetRepositoryMock,
      2
    )
  })

  it('releases oldest extra worksheet taken by user', async () => {
    const testQueue = WorksheetQueue({
      id: 'test-queue-id',
      source: {
        province: 'TEST_BARCELONA',
      },
      name: 'test-worksheet-queue',
      worksheets: [
        {
          worksheetId: '3-hours-ago-worksheet',
          operatorId: testUserId,
          status: QueueStatus.OPENED,
          addedAt: moment().add(-3, 'hours').toDate()
        },
        {
          worksheetId: '2-hours-ago-worksheet',
          operatorId: testUserId,
          status: QueueStatus.OPENED,
          addedAt: moment().add(-2, 'hours').toDate()
        },
        {
          worksheetId: '1-hour-ago-worksheet',
          operatorId: testUserId,
          status: QueueStatus.OPENED,
          addedAt: moment().add(-1, 'hour').toDate()
        }
      ]
    })
    worksheetQueueRepositoryMock.get.withArgs(testQueueId).resolves(testQueue)
    const testOpenedWorksheet = worksheetBuilder({id: '3-hours-ago-worksheet'}).build()
    worksheetRepositoryMock.get.withArgs('3-hours-ago-worksheet').resolves(testOpenedWorksheet)
    worksheetRepositoryMock.save.resolves()

    await service.release(testUserId, testQueueId)

    const savedQueue = worksheetQueueRepositoryMock.save.lastCall.args[ 0 ]
    expect(savedQueue.worksheets).to.have.lengthOf(2)
    expect(savedQueue.worksheets.find(w => w.id === '3-hours-ago-worksheet')).to.be.undefined

    expect(worksheetRepositoryMock.save).to.have.been
      .calledWithMatch(
        ws => ws.id === '3-hours-ago-worksheet' &&
          ws.status === WorkSheetStatus.AVAILABLE &&
          ws.queueId === null &&
          (new Date().valueOf() - ws.statusChangedAt.valueOf() < 100)
      )
  })
})
