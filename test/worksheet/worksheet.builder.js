import { Worksheet } from '../../src/worksheet/domain/worksheet'

const worksheetPrototype = {
  id: 'test-worksheet-id',
  relatedBuildingIds: [ 'test-worksheet-building-id' ]
}
export const worksheetBuilder = (overrides = {}) => ({
  build: () => {
    return Worksheet({ ...worksheetPrototype, ...overrides })
  }
})
