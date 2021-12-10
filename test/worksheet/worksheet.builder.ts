import { Worksheet, WorksheetProps } from '../../src/worksheet/domain/worksheet'

const worksheetPrototype: WorksheetProps = {
  status: 'OPEN',
  id: 'test-worksheet-id',
  relatedBuildingIds: [ 'test-worksheet-building-id' ],
  buildingAddress: {
    street: 'test street',
    number: 123,
    city: 'Test City'
  },

}

export const worksheetBuilder = (overrides: Partial<WorksheetProps> = {}) =>
  ({
    build: () => {
      return Worksheet({
        ...worksheetPrototype,
        ...overrides
      })
    }
  })
