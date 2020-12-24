/**
 * @property {CouchbaseAdapter} couchbaseAdapter
 */
export class CouchbaseRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  get bucketName () {
    return this.couchbaseAdapter.bucketName
  }

  get (entityId) {
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

  struct () {
    throw new Error('Couchbase repository must implement struct method')
  }
}
