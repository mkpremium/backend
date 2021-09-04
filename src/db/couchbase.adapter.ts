import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { EntityNotFound, KeyNotFound, QueryError } from './errors'
import { validate } from 'tcomb-validation'
import { WrongStructRecord } from '../infrastructure/wrong-struct-record.error'
import retry from 'bluebird-retry'
import { Bucket, errors as couchbaseErrors, errors, N1qlQuery } from 'couchbase'
import { CouchbaseRecordToDomain, RecordToDomain } from '../infrastructure/couchbase/record-to-domain'
import { promisifyAll } from 'bluebird'
import Consistency = N1qlQuery.Consistency
import honeycomb from 'honeycomb-beeline'

export type PromisifiedBucket = Bucket & {
  queryAsync: (query: N1qlQuery, params?: { [ param: string ]: any } | any[]) => Promise<any[] | null>,
  getAsync: (key: string) => Promise<{ value: any, cas: any }>
  upsertAsync: (key: string, value: any, opts?: { cas: Bucket.CAS }) => Promise<any>
  insertAsync(key: string, value: any): Promise<void>;
  getAndLockAsync: (key: string) => Promise<any>
  unlockAsync: (key: string, cas: Bucket.CAS) => Promise<any>
  name: string
}

export class CouchbaseAdapter {
  private couchbaseBucket: PromisifiedBucket

  constructor (couchbaseBucket: Bucket) {
    this.couchbaseBucket = promisifyAll(couchbaseBucket) as PromisifiedBucket
  }

  get bucketName (): string {
    return this.couchbaseBucket.name
  }

  async save<T extends { _documentType: string, id?: string }> (data: T, structType: t.Type<T>, cas?: any) {
    const struct = fromJSON(data, structType)
    const dataWithId: any = t.update(struct, { id: { $set: data.id || uuid() } })

    const validationResult = validate(dataWithId, structType)
    if (!validationResult.isValid()) {
      throw new WrongStructRecord(data._documentType, validationResult.errors, data)
    }

    await this.withRetry(() => this.upsert(dataWithId.id, dataWithId, cas)
    )

    return fromJSON(dataWithId, structType)
  }

  getEntity<T> (structType: t.Type<T> & Partial<RecordToDomain>, entityId): Promise<T> {
    return this.withRetry(
      () => {
        const beeline = honeycomb()
        const span = beeline.startSpan({ name: 'couchbase_get', key: entityId })
        return this.couchbaseBucket.getAsync(entityId)
          .finally(() => beeline.finishSpan(span))
          .catch(error => {
            if (error.code === errors.keyNotFound) {
              throw new EntityNotFound(entityId, structType)
            }
            throw error
          })
          .then(result => {
            const parsedRecord = fromJSON(result.value, structType)
            if (CouchbaseRecordToDomain.is(parsedRecord)) {
              return (parsedRecord as unknown as RecordToDomain).couchbaseToDomain()
            }

            return parsedRecord
          })
      }
    )
  }

  queryAsync (query: string, params?): Promise<any> {
    return this.withRetry(() => {
        const beeline = honeycomb()
        const span = beeline.startSpan({ name: 'couchbase_query' })
        return this.couchbaseBucket.queryAsync(N1qlQuery.fromString(query).consistency(Consistency.REQUEST_PLUS), params)
          .finally(() => beeline.finishSpan(span))
      }
    ).catch(error => {
      if (error.code) {
        throw new QueryError(query, error.code, error.message)
      } else {
        throw error
      }
    })
  }

  getAndLock (key: string): Promise<{ cas: any, value: any }> {
    return this.couchbaseBucket.getAndLockAsync(key)
      .catch(error => {
        if (error.code === errors.keyNotFound) {
          throw new KeyNotFound(key)
        }
        throw error
      })
  }

  unlock (key: string, lock: any) {
    return this.couchbaseBucket.unlockAsync(key, lock)
  }

  upsert (key: string, obj: object, cas?: any) {
    const beeline = honeycomb()
    const span = beeline.startSpan({ name: 'couchbase_upsert', key })

    return (cas ? this.couchbaseBucket.upsertAsync(key, obj, { cas }) : this.couchbaseBucket.upsertAsync(key, obj))
      .finally(() => beeline.finishSpan(span))
  }

  insert (id: string, value: any) {
    return this.couchbaseBucket.insertAsync(id, value)
  }

  get (id: string) {
    return this.couchbaseBucket.getAsync(id)
  }

  private withRetry<T> (fn: () => Promise<T>): Promise<T> {
    return retry<T>(fn, {
      max_tries: 5,
      interval: 1000,
      backoff: 1.5,
      predicate: ({
                    code,
                    message,
                  }) => code === couchbaseErrors.temporaryError || message.includes('Indexer rollback from')
    })
  }
}
