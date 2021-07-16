import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { EntityNotFound, KeyNotFound, QueryError } from './errors'
import { validate } from 'tcomb-validation'
import { WrongStructRecord } from '../infrastructure/wrong-struct-record.error'
import retry from 'bluebird-retry'
import {
  Bucket,
  Cluster,
  DocumentNotFoundError,
  GetResult,
  QueryScanConsistency,
  TemporaryFailureError,
} from 'couchbase'
import { CouchbaseRecordToDomain, RecordToDomain } from '../infrastructure/couchbase/record-to-domain'

export class CouchbaseAdapter {
  constructor (
    private couchbaseBucket: Bucket,
  ) {
  }

  get bucketName (): string {
    return this.couchbaseBucket.name
  }

  get couchbaseCluster (): Cluster {
    return this.couchbaseBucket.cluster
  }

  async save<T extends { _documentType: string, id?: string }> (data: T, structType: t.Type<T>) {
    const struct = fromJSON(data, structType)
    const dataWithId: any = t.update(struct, { id: { $set: data.id || uuid() } })

    const validationResult = validate(dataWithId, structType)
    if (!validationResult.isValid()) {
      throw new WrongStructRecord(data._documentType, validationResult.errors, data)
    }

    await this.withRetry(() =>
      this.upsert(dataWithId.id, dataWithId)
    )

    return fromJSON(dataWithId, structType)
  }

  getEntity<T> (structType: t.Type<T> & Partial<RecordToDomain>, entityId): Promise<T> {
    return this.withRetry(
      () => this.get(entityId)
        .catch(error => {
          if (error instanceof DocumentNotFoundError) {
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
    )
  }

  get (documentKey): Promise<GetResult> {
    return this.couchbaseBucket.defaultCollection().get(documentKey)
  }

  queryAsync (query: string, params?): Promise<any> {
    return this.withRetry(() =>
      this.couchbaseCluster.query(query, {
        parameters: params,
        scanConsistency: QueryScanConsistency.RequestPlus,
      })
    ).then(result => result.rows)
      .catch(error => {
        if (error.code) {
          this.throwCouchbaseError(error, query)
        } else {
          throw error
        }
      })
  }

  getAndLock (key: string, secondsToLock = 10) {
    return this.couchbaseBucket.defaultCollection().getAndLock(key, secondsToLock)
      .catch(error => {
        if (error instanceof DocumentNotFoundError) {
          throw new KeyNotFound(key)
        }
        throw error
      })
  }

  unlock (key: string, lock: any) {
    return this.couchbaseBucket.defaultCollection().unlock(key, lock)
  }

  upsert (key: string, obj: object) {
    return this.couchbaseBucket.defaultCollection().upsert(key, obj)
  }

  private throwCouchbaseError (error, query: string) {
    if (error.code) {
      throw new QueryError(query, error.code, error.message)
    } else {
      throw error
    }
  }

  private withRetry<T> (fn: () => Promise<T>): Promise<T> {
    return retry<T>(fn, {
      max_tries: 5,
      interval: 1000,
      backoff: 1.5,
      predicate: error => error instanceof TemporaryFailureError
    })
  }
}
