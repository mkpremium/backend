import { ReleaseUserExtraOpenedWorksheetsInQueueService } from '../../../src/worksheet/service/release-user-extra-opened-worksheets-in-queue.service'
import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { WorksheetQueue, WorkSheetStatus } from '../../../src/worksheet/domain/worksheet'
import moment from 'moment'
import { QueueStatus } from '../../../src/worksheet/models/queue-item'

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
      source: {},
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

    await service.release(testUserId, testQueueId)

    const savedQueue = worksheetQueueRepositoryMock.save.lastCall.args[ 0 ]
    expect(savedQueue.worksheets).to.have.lengthOf(2)
    expect(savedQueue.worksheets.find(w => w.id === '3-hours-ago-worksheet')).to.be.undefined

    expect(worksheetRepositoryMock.patch).to.have.been
      .calledWithMatch('3-hours-ago-worksheet',
        patch => patch.status === WorkSheetStatus.AVAILABLE && patch.queueId === null && new Date().valueOf() - patch.statusChangedAt.valueOf() < 100
      )
  })
})
