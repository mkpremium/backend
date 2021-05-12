import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { EntityNotFound, QueryError } from './errors'
import { validate } from 'tcomb-validation'
import { WrongStructRecord } from '../infrastructure/wrong-struct-record.error'
import retry from 'bluebird-retry'
import { Bucket, errors as couchbaseErrors, errors, N1qlQuery } from 'couchbase'
import { CouchbaseRecordToDomain } from '../infrastructure/couchbase/record-to-domain'
import { promisifyAll } from 'bluebird'
import Consistency = N1qlQuery.Consistency

export type PromisifiedBucket = Bucket & {
  queryAsync: (query: N1qlQuery, params?: { [param: string]: any } | any[]) => Promise<any[] | null>,
  getAsync: (key: string) => Promise<{ value: any, cas: any }>
  upsertAsync: (key: string, value: any) => Promise<any>
  name: string
}

export class CouchbaseAdapter {
  private couchbaseBucket: PromisifiedBucket

  constructor(couchbaseBucket: Bucket) {
    this.couchbaseBucket = promisifyAll(couchbaseBucket) as PromisifiedBucket
  }

  get bucketName() {
    return this.couchbaseBucket.name
  }

  async save(data, structType) {
    const struct = fromJSON(data, structType)
    const dataWithId: any = t.update(struct, { id: { $set: data.id || uuid() } })

    const validationResult = validate(dataWithId, structType)
    if (!validationResult.isValid()) {
      throw new WrongStructRecord(data._documentType, validationResult.errors, data)
    }

    await this.withRetry(() =>
      this.couchbaseBucket.upsertAsync(dataWithId.id, dataWithId)
    )

    return fromJSON(dataWithId, structType)
  }

  getEntity(structType, entityId) {
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

  queryAsync(query: string, params) {
    return this.withRetry(() =>
      this.couchbaseBucket.queryAsync(N1qlQuery.fromString(query).consistency(Consistency.REQUEST_PLUS), params)
    ).catch(error => {
      if (error.code) {
        this.throwCouchbaseError(error, query)
      } else {
        throw error
      }
    })
  }

  throwCouchbaseError(error, query) {
    if (error.code) {
      throw new QueryError(query, error.code, error.message)
    } else {
      throw error
    }
  }

  withRetry(fn) {
    return retry(fn, {
      maxTries: 3,
      interval: 100,
      predicate: ({
                    code,
                    message
                  }) => code === couchbaseErrors.temporaryError || message.includes('Indexer rollback from')
    })
  }
}
