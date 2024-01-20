import { WorksheetQueue, WorksheetQueueProps } from '../../src/worksheet/domain/queue'

const queuePrototype: WorksheetQueueProps = {
  id: 'test-worksheet-queue-id',
  name: 'test queue',
  source: {
    province: 'TEST_BARCELONA',
  },
  worksheets: [],
}

export function worksheetQueueBuilder (overrides: Partial<WorksheetQueueProps> = {}) {
  return {
    build (): WorksheetQueueProps {
      return WorksheetQueue({ ...queuePrototype, ...overrides })
    }
  }
}
