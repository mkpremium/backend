import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'

describe('worksheet.repository', () => {
  it('parses callcenter view', () => {
    fromJSON([], t.list(CallcenterView))
  })
})
