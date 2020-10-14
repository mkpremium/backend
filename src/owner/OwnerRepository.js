import t from 'tcomb'
import { Owner } from './owner'

export class OwnerRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  async setOwnerFeaturedContact (ownerId, featuredContact) {
    const owner = await this.couchbaseAdapter.getEntity(Owner, ownerId)
    if (!owner) {
      throw new OwnerNotFound(ownerId)
    }

    const updatedOwner = t.update(owner, {
      featuredContact: { $set: featuredContact }
    })

    return this.couchbaseAdapter.save(updatedOwner, Owner)
  }
}

export class OwnerNotFound extends Error {
  constructor (ownerId) {
    super()
    this.message = `Owner with id ${ownerId} not found`
  }
}
