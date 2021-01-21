import { expect } from 'chai'
import { GetStatsFilter, GetStatsFilterFixed } from '../../src/stats/models'

describe('GetStatsFilter', () => {
  it('dispatches right type for empty params', () => {
    expect(GetStatsFilter({})).to.be.deep.equal(GetStatsFilterFixed({ range: 'today', view: 'total' }))
  })
})
