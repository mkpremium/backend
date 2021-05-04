import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { errors as couchbaseErrors, errors, N1qlQuery } from 'couchbase'
import { EntityNotFound, QueryError, QueryTimeout } from './errors'
import { CouchbaseRecordToDomain } from '../infrastructure/couchbase/record-to-domain'
import { validate } from 'tcomb-validation'
import { WrongStructRecord } from '../infrastructure/wrong-struct-record.error'
import retry from 'bluebird-retry'

export class CouchbaseAdapter {
  constructor (couchbaseBucket, forceMaxQueryConsistency) {
    this.couchbaseBucket = couchbaseBucket
    this.forceMaxQueryConsistency = forceMaxQueryConsistency
  }

  get bucketName () {
    return this.couchbaseBucket.name
  }

  async save (data, structType) {
    const struct = fromJSON(data, structType)
    const dataWithId = t.update(struct, { id: { $set: data.id || uuid() } })

    const validationResult = validate(dataWithId, structType)
    if (!validationResult.isValid()) {
      throw new WrongStructRecord(data._documentType, validationResult.errors, data)
    }

    const result = await this.withRetry(() => this.couchbaseBucket.upsertToDb(dataWithId.id, dataWithId))

    return fromJSON(result, structType)
  }

  getEntity (structType, entityId) {
    return this.withRetry(
      () => this.couchbaseBucket.getAsync(entityId)
        .catch(error => {
          if (error.code === errors.keyNotFound) {
            throw new EntityNotFound(entityId, structType)
          }
          throw error
        })
        .then(result => {
          const parsedRecord = fromJSON(result.value, structType)
          if (CouchbaseRecordToDomain.is(parsedRecord)) {
            return parsedRecord.couchbaseToDomain()
          }

          return parsedRecord
        })
    )
  }

  queryAsync (query, params) {
    if (this.forceMaxQueryConsistency) {
      query = query.consistency(N1qlQuery.Consistency.STATEMENT_PLUS)
    }

    return this.withRetry(() => this.couchbaseBucket.queryAsync(query, params)
      .catch(error => {
        console.log({ error })
        if (error.responseBody === '') {
          throw new QueryTimeout(query)
        }
        if (error.code) {
          this.throwCouchbaseError(error, query)
        } else {
          throw error
        }
      })
    )
  }

  throwCouchbaseError (error, query) {
    const couchbaseError = Object.entries(errors).find(([ k, v ]) => v === error.code)
    if (couchbaseError) {
      throw new QueryError(query, error.code, couchbaseError[ 0 ])
    } else {
      throw error
    }
  }

  withRetry (fn) {
    return retry(fn, {
      maxTries: 3,
      interval: 100,
      predicate: ({ code, message }) => code === couchbaseErrors.temporaryError || message.includes('Indexer rollback from')
    })
  }
}
