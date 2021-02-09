import {
  takeWorksheet,
  Worksheet,
  WorksheetAlreadyTaken,
  WorksheetQueue
} from '../../../src/worksheet/domain/worksheet'
import { expect } from 'chai'
import { QueueItem } from '../../../src/worksheet/models/queue-item'

describe('WorksheetQueue', () => {
  describe('takeWorksheet', () => {
    it('adds worksheet to its list', () => {
      const testWorksheet = Worksheet({ id: 'test-worksheet-id' })
      const testQueue = WorksheetQueue({
        name: 'test queue'
      })

      const [ queueWithWorksheet ] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')

      expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
    })

    it('does not add an existing worksheet', () => {
      const testWorksheet = Worksheet({ id: 'test-worksheet-id' })
      const testQueue = WorksheetQueue({
        name: 'test queue',
        worksheets: [ QueueItem({
          worksheetId: testWorksheet.id,
          operatorId: 'test-user-id'
        }) ]
      })

      const [ queueWithWorksheet ] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')

      expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
    })

    it('does not allow to take a worksheet taken by a different user', () => {
      const testWorksheet = Worksheet({ id: 'test-worksheet-id' })
      const testQueue = WorksheetQueue({
        name: 'test queue',
        worksheets: [ QueueItem({
          worksheetId: testWorksheet.id,
          operatorId: 'other-user-id'
        }) ]
      })

      expect(() => takeWorksheet(testQueue, testWorksheet, 'test-user-id'))
        .to.throw(WorksheetAlreadyTaken)
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
