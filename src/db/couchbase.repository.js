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

  save (entityData) {
    return this.couchbaseAdapter.save(entityData, this.struct())
  }

  struct () {
    throw new Error('Couchbase repository must implement struct method')
  }
}
