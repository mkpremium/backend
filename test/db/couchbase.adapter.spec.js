import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'
import { expect } from 'chai'
import { stub } from 'sinon'
import { QueryError, QueryTimeout } from '../../src/db/errors'
import { N1qlQuery, errors } from 'couchbase'

describe('CouchbaseAdapter', () => {
  describe('queryAsync', () => {
    let adapter
    let couchbaseBucketStub
    beforeEach(() => {
      couchbaseBucketStub = {
        queryAsync: stub()
      }

      adapter = new CouchbaseAdapter(couchbaseBucketStub)
    })

    it('translate empty responses error to timeout error', () => {
      const timeoutError = new Error()
      timeoutError.responseBody = ''

      couchbaseBucketStub.queryAsync.rejects(timeoutError)

      return adapter.queryAsync(N1qlQuery.fromString('SELECT 1'))
        .catch(error => {
          expect(error).to.be.instanceOf(QueryTimeout)
        })
    })

    it('translates errors to QueryError', () => {
      const queryError = new Error()
      queryError.code = errors.temporaryError

      couchbaseBucketStub.queryAsync.rejects(queryError)

      return adapter.queryAsync(N1qlQuery.fromString('SELECT 1'))
        .catch(error => {
          expect(error).to.be.instanceOf(QueryError)
          expect(error.code).to.be.equal(errors.temporaryError)
          expect(error.name).to.be.equal('temporaryError')
        })
    })
  })
})
