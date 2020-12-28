import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'
import { expect } from 'chai'
import { stub } from 'sinon'
import { QueryTimeout } from '../../src/db/errors'
import { N1qlQuery } from 'couchbase'

describe('CouchbaseAdapter', () => {
  describe('queryAsync', () => {
    it('translate empty responses error to timeout error', () => {
      const couchbaseBucketStub = {
        queryAsync: stub()
      }
      const timeoutError = new Error()
      timeoutError.responseBody = ''

      couchbaseBucketStub.queryAsync.rejects(timeoutError)
      const adapter = new CouchbaseAdapter(couchbaseBucketStub)

      return adapter.queryAsync(N1qlQuery.fromString('SELECT 1'))
        .catch(error => {
          expect(error).to.be.instanceOf(QueryTimeout)
        })
    })
  })
})
