import { Worksheet, WorksheetQueue } from '../../../src/worksheet/domain/worksheet'
import { expect } from 'chai'
import { QueueItem } from '../../../src/worksheet/models/queue-item'

describe('WorksheetQueue', () => {
  describe('takeWorksheet', () => {
    it('adds worksheet to its list', () => {
      const testWorksheet = Worksheet({ id: 'test-worksheet-id' })
      const testQueue = WorksheetQueue({
        name: 'test queue'
      })

      const [ queueWithWorksheet ] = testQueue.takeWorksheet(testWorksheet, 'test-user-id')

      expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
    })

    it('does not add an existing worksheet', () => {
      const testWorksheet = Worksheet({ id: 'test-worksheet-id' })
      const testQueue = WorksheetQueue({
        name: 'test queue',
        worksheets: [ QueueItem({ worksheetId: testWorksheet.id }) ]
      })

      const [ queueWithWorksheet ] = testQueue.takeWorksheet(testWorksheet, 'test-user-id')

      expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
    })
  })
})
