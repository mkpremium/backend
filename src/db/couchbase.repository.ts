import { CouchbaseAdapter } from './couchbase.adapter'
import { Struct } from 'tcomb'
import { RecordToDomain } from '../infrastructure/couchbase/record-to-domain'

export class CouchbaseRepository<T> {
  constructor (
    protected couchbaseAdapter: CouchbaseAdapter
  ) {
  }

  get bucketName () {
    return this.couchbaseAdapter.bucketName
  }

  get (entityId): Promise<T> {
    return this.couchbaseAdapter.getEntity(this.struct(), entityId)
  }

  async patch (entityId, patch) {
    const entity = await this.get(entityId)
    const patchedEntity = this.struct().update(entity, patch)

    return this.save(patchedEntity)
  }

  save (entityData) {
    return this.couchbaseAdapter.save(entityData, this.struct())
  }

  struct (): Struct<any> & RecordToDomain {
    throw new Error('Couchbase repository must implement struct method')
  }
}
