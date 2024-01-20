import {
  releaseWorksheet,
  takeWorksheet,
  WorkSheetStatus,
  WorksheetStatusType
} from '../../../src/worksheet/domain/worksheet'
import { expect } from 'chai'
import { QueueItem, QueueItemStatus } from '../../../src/worksheet/models/queue-item'
import { worksheetBuilder } from '../worksheet.builder'
import { worksheetQueueBuilder } from '../worksheet-queue.builder'
import { removeScheduledCallFromItem } from '../../../src/worksheet/domain/queue'

const testWorksheet = worksheetBuilder().build()

describe('releaseWorksheet', () => {
  it('changes status to LOOKING_MEETING when worksheet is OPEN', () => {
    expect(releaseWorksheet(worksheetBuilder({ status: 'OPEN' }).build()).status)
      .to.be.eql(WorkSheetStatus.AVAILABLE)
  })

  it('changes status to LOOKING_MEETING when worksheet is TAKEN', () => {
    expect(releaseWorksheet(worksheetBuilder({ status: 'TAKEN' }).build()).status)
      .to.be.eql(WorkSheetStatus.AVAILABLE)
  });

  [
    WorkSheetStatus.NO_SALE,
    WorkSheetStatus.AVAILABLE,
    WorkSheetStatus.INVALID,
    WorkSheetStatus.NO_SALE,
    WorkSheetStatus.ALREADY_SOLD,
    WorkSheetStatus.MEETING,
    WorkSheetStatus.PUBLIC,
  ].forEach((finalStatus: WorksheetStatusType) =>
    it(`does not change final status(${finalStatus})`, () => {
      expect(releaseWorksheet(worksheetBuilder({ status: finalStatus }).build()).status)
        .to.be.eql(finalStatus)
    })
  )
})

describe('WorksheetQueue', () => {
  describe('takeWorksheet', () => {
    it('adds worksheet to its list', () => {
      const testQueue = worksheetQueueBuilder().build()

      const [ queueWithWorksheet ] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')

      expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
    })

    it('does not add an existing worksheet', () => {
      const testQueue = worksheetQueueBuilder({
        worksheets: [ {
          worksheetId: testWorksheet.id,
          operatorId: 'test-user-id',
          status: QueueItemStatus.OPENED,
          addedAt: new Date(),
        } ]
      }).build()

      const [ queueWithWorksheet ] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')

      expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
    })

    it('updates the viewedAt field', () => {
      expect(testWorksheet.viewedAt).to.be.undefined
      const testQueue = worksheetQueueBuilder().build()
      const [ _, updatedWorksheet ] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')


      expect(updatedWorksheet.viewedAt).to.be.instanceof(Date)
    })
  })
})

describe('QueueItem', () => {
  describe('removeScheduledCall', () => {
    it('fails when there is no scheduled call', () => {
      const testQueueItem = QueueItem({ worksheetId: 'test-worksheet-id' } as any)
      expect(() => removeScheduledCallFromItem(testQueueItem)).to.throw(/worksheet is not scheduled/)
    })
  })
})
