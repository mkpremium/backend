import { N1qlQuery } from 'couchbase'

const setBuildingFeaturedOwner = `
UPDATE mkpremium
SET ownerId = $2
WHERE _documentType = 'building' AND id = $1
`

export class BuildingsRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  async setBuildingFeaturedOwner (buildingId, ownerId) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(setBuildingFeaturedOwner), [ buildingId, ownerId ]
    )
  }
}
