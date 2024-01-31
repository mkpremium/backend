import { Worksheet, WorksheetProps } from '../../src/worksheet/domain/worksheet'
import uuid from 'uuid/v4'

const worksheetPrototype: WorksheetProps = {
  status: 'OPEN',
  id: 'test-worksheet-id',
  relatedBuildingIds: ['test-worksheet-building-id'],
  buildingAddress: {
    street: 'test street',
    number: 123,
    city: 'Test City'
  }
}

export const worksheetBuilder = (overrides: Partial<WorksheetProps> = {}) =>
  ({
    build: () => {
      return Worksheet({
        ...worksheetPrototype,
        id: uuid(),
        ...overrides
      })
    }
  })
