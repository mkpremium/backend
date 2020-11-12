import { N1qlQuery } from 'couchbase'
import { Building } from './building'

const setBuildingFeaturedOwner = `
UPDATE $3
SET ownerId = $2
WHERE _documentType = 'building' AND id = $1
`

const setBuildingNegotiationStatusQuery = `
UPDATE $3
SET negotiationStatus = $2
WHERE _documentType = 'building' AND id = $1
`

const assignBuildingToAgentQuery = `
UPDATE $3
SET assignedAgentId = $2
WHERE _documentType = 'building' AND id = $1
`

const pullBuildingOutOfFreezerQuery = `
UPDATE $2
UNSET assignedAgentId, negotiationStatus
WHERE _documentType = 'building' AND id IN $1
`

export class BuildingsRepository {
  /**
   * @param {CouchbaseAdapter} couchbaseAdapter
   */
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  async setBuildingFeaturedOwner (buildingId, ownerId) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(setBuildingFeaturedOwner),
      [ buildingId, ownerId, this.couchbaseAdapter.bucketName ]
    )
  }

  async setBuildingNegotiationStatus (buildingId, negotiationStatus) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(setBuildingNegotiationStatusQuery),
      [ buildingId, negotiationStatus, this.couchbaseAdapter.bucketName ]
    )
  }

  async assignBuildingToAgent (buildingId, agentId) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(assignBuildingToAgentQuery), [ buildingId, agentId, this.couchbaseAdapter.bucketName ]
    )
  }

  async pullBuildingsOutOfFreezer (buildingIds) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(pullBuildingOutOfFreezerQuery), [ buildingIds, this.couchbaseAdapter.bucketName ]
    )
  }

  get (buildingId) {
    return this.couchbaseAdapter.getEntity(Building, buildingId)
  }

  save (building) {
    return this.couchbaseAdapter.save(building, Building)
  }
}
