import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { errors } from 'couchbase'
import { EntityNotFound } from './errors'

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
      .then(result => fromJSON(result.value, structType))
  }

  queryAsync (...args) {
    return this.couchbaseBucket.queryAsync(...args)
  }
}
