import { Worksheet, WorksheetProps } from '../../src/worksheet/domain/worksheet'

const worksheetPrototype: WorksheetProps = {
  status: 'OPEN',
  id: 'test-worksheet-id',
  relatedBuildingIds: [ 'test-worksheet-building-id' ]
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
