import { QueueItem } from '../../../src/worksheet/models/queue-item'
import { expect } from 'chai'
import { removeScheduledCallFromItem } from '../../../src/worksheet/domain/queue'

describe('QueueItem', () => {
  describe('removeScheduledCall', () => {
    it('fails when there is no scheduled call', () => {
      const testQueueItem = QueueItem({ worksheetId: 'test-worksheet-id' } as any)
      expect(() => removeScheduledCallFromItem(testQueueItem)).to.throw(/worksheet is not scheduled/)
    })
  })
})
