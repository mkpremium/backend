import { worksheetQueueBuilder } from '../worksheet-queue.builder'
import { takeWorksheet, type WorksheetProps } from '../../../src/worksheet/domain/worksheet'
import { expect } from 'chai'
import { QueueItemStatus } from '../../../src/worksheet/models/queue-item'
import { worksheetBuilder } from '../worksheet.builder'

const testWorksheet = worksheetBuilder().build()

describe('takeWorksheet', () => {
  it('adds worksheet to its list', () => {
    const testQueue = worksheetQueueBuilder().build()

    const [queueWithWorksheet] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')

    expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
  })

  it('does not add an existing worksheet', () => {
    const testQueue = worksheetQueueBuilder({
      worksheets: [{
        worksheetId: testWorksheet.id,
        operatorId: 'test-user-id',
        status: QueueItemStatus.OPENED,
        addedAt: new Date()
      }]
    }).build()

    const [queueWithWorksheet] = takeWorksheet(testQueue, testWorksheet, 'test-user-id')

    expect(queueWithWorksheet.worksheets).to.have.lengthOf(1)
  })

  it('updates the viewedAt field', () => {
    expect(testWorksheet.viewedAt).to.be.undefined
    const testQueue = worksheetQueueBuilder().build()
    const result = takeWorksheet(testQueue, testWorksheet, 'test-user-id')
    const updatedWorksheet = result.pop() as WorksheetProps

    expect(updatedWorksheet.viewedAt).to.be.instanceof(Date)
  })
})
