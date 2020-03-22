import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'

export class CouchbaseAdapter {
  constructor (couchbaseBucket) {
    this.couchbaseBucket = couchbaseBucket
  }

  async save (data, structType) {
    const struct = fromJSON(data, structType)
    const dataWithId = t.update(struct, { id: { $set: data.id || uuid() } })

    const result = await this.couchbaseBucket.upsertToDb(dataWithId.id, dataWithId)

    return fromJSON(result, structType)
  }

  async getEntity (structType, entityId) {
    const result = await this.couchbaseBucket.getAsync(entityId)
    if (!(result && result.value)) {
      return null
    }

    return fromJSON(result.value, structType)
  }

  queryAsync (...args) {
    return this.couchbaseBucket.queryAsync(...args)
  }
}
