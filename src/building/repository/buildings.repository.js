import { N1qlQuery } from 'couchbase'
import { Building } from '../building'
import { CouchbaseRepository } from '../../db/couchbase.repository'

const setBuildingFeaturedOwner = bucketName => `
UPDATE ${bucketName} building
SET building.ownerId = $2
WHERE building._documentType = 'building' AND building.id = $1
`

const setBuildingNegotiationStatusQuery = bucketName => `
UPDATE ${bucketName}
SET negotiationStatus = $2
WHERE _documentType = 'building' AND id = $1
`

const assignBuildingToAgentQuery = bucketName => `
UPDATE ${bucketName} building
SET building.assignedAgentId = $2
WHERE building._documentType = 'building' AND building.id = $1
`

const pullBuildingOutOfFreezerQuery = bucketName => `
UPDATE ${bucketName} building
UNSET building.assignedAgentId, building.negotiationStatus
WHERE building._documentType = 'building' AND building.id IN $1
`

export class BuildingsRepository extends CouchbaseRepository {
  async setBuildingFeaturedOwner (buildingId, ownerId) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(setBuildingFeaturedOwner(this.couchbaseAdapter.bucketName)),
      [ buildingId, ownerId ]
    )
  }

  async setBuildingNegotiationStatus (buildingId, negotiationStatus) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(setBuildingNegotiationStatusQuery(this.couchbaseAdapter.bucketName)),
      [ buildingId, negotiationStatus ]
    )
  }

  async assignBuildingToAgent (buildingId, agentId) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(assignBuildingToAgentQuery(this.couchbaseAdapter.bucketName)), [ buildingId, agentId ]
    )
  }

  async pullBuildingsOutOfFreezer (buildingIds) {
    await this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(pullBuildingOutOfFreezerQuery(this.couchbaseAdapter.bucketName)), [ buildingIds ]
    )
  }

  struct () {
    return Building
  }
}
