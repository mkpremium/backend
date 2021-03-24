import { Worksheet } from '../../src/worksheet/domain/worksheet'

const worksheetPrototype = {}
export const worksheetBuilder = (overrides = {}) => ({
  build: () => {
    return Worksheet({ ...worksheetPrototype, ...overrides })
  }
})
