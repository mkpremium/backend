import { WorksheetQueue } from '../../../src/worksheet/domain/queue'
import { takeWorksheet } from '../../../src/worksheet/domain/worksheet'
import { expect } from 'chai'
import { QueueItem } from '../../../src/worksheet/models/queue-item'
import { worksheetBuilder } from '../worksheet.builder'
import { worksheetQueueBuilder } from '../worksheet-queue.builder'

const testWorksheet = worksheetBuilder().build()

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
          operatorId: 'test-user-id'
        } ]
      }).build()

      const [ queueWithWorksheet ] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')

      expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
    })
  })
})

describe('QueueItem', () => {
  describe('removeScheduledCall', () => {
    it('fails when there is no scheduled call', () => {
      const testQueueItem = QueueItem({ worksheetId: 'test-worksheet-id' })
      expect(() => testQueueItem.removeScheduledCall()).to.throw(/worksheet is not scheduled/)
    })
  })
})
