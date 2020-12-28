import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { errors } from 'couchbase'
import { EntityNotFound, QueryTimeout } from './errors'
import { CouchbaseRecordToDomain } from '../infrastructure/couchbase/record-to-domain'

export class CouchbaseAdapter {
  constructor (couchbaseBucket) {
    this.couchbaseBucket = couchbaseBucket
  }

  get bucketName () {
    return this.couchbaseBucket.name
  }

  async save (data, structType) {
    const struct = fromJSON(data, structType)
    const dataWithId = t.update(struct, { id: { $set: data.id || uuid() } })

    const result = await this.couchbaseBucket.upsertToDb(dataWithId.id, dataWithId)

    return fromJSON(result, structType)
  }

  getEntity (structType, entityId) {
    return this.couchbaseBucket.getAsync(entityId)
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
  }

  queryAsync (query, params) {
    return this.couchbaseBucket.queryAsync(query, params)
      .catch(error => {
        if (error.responseBody === '') {
          throw new QueryTimeout(query)
        }
        throw error
      })
  }
}
