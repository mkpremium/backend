import { expect } from 'chai'
import { addBetweenQueryToBuilder } from '../../../src/lib/query/helpers'
import squel from 'squel'
import moment from 'moment'

describe('addBetweenQueryToBuilder', () => {
  it('adds between query to query builder', () => {
    const expectedQueryBuilder = squel.select()
      .where('createdAt >= ?', moment.utc('2021-01-21').startOf('day').toDate())
      .where('createdAt < ?', moment.utc('2021-01-21').endOf('day').toDate())

    const testQueryBuilder = squel.select()
    addBetweenQueryToBuilder(testQueryBuilder, 'createdAt', '2021-01-21,2021-01-21')
    expect(testQueryBuilder.toParam()).to.be.deep.equal(expectedQueryBuilder.toParam())
  })
})
