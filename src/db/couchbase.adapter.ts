import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { EntityNotFound, QueryError } from './errors'
import { validate } from 'tcomb-validation'
import { WrongStructRecord } from '../infrastructure/wrong-struct-record.error'
import retry from 'bluebird-retry'
import {
  Bucket,
  Cluster,
  DocumentNotFoundError,
  InternalServerFailureError,
  QueryScanConsistency,
  TemporaryFailureError
} from 'couchbase'
import { CouchbaseRecordToDomain } from '../infrastructure/couchbase/record-to-domain'


export class CouchbaseAdapter {
  constructor(
    private couchbaseBucket: Bucket,
    private couchbaseCluster: Cluster
  ) {
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
      this.couchbaseBucket.defaultCollection().upsert(dataWithId.id, dataWithId)
    )

    return fromJSON(dataWithId, structType)
  }

  getEntity(structType, entityId) {
    return this.withRetry(
      () => this.couchbaseBucket
        .defaultCollection()
        .get(entityId)
        .catch(error => {
          if (error instanceof DocumentNotFoundError) {
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

  queryAsync(query, params) {
    return this.withRetry(
      () => this.couchbaseCluster.query(query, {
        parameters: params,
        scanConsistency: QueryScanConsistency.RequestPlus
      })
    ).then(({ rows }) => rows)
      .catch(error => {
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
      predicate: error => error instanceof TemporaryFailureError || error instanceof InternalServerFailureError
    })
  }
}
