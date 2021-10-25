import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Building, BuildingProps } from '../building'

const setBuildingFeaturedOwner = bucketName => `
UPDATE ${bucketName} building
SET building.ownerId = $2
WHERE building._documentType = 'building' AND building.id = $1
`

const assignBuildingToAgentQuery = bucketName => `
UPDATE ${bucketName} building
SET building.assignedAgentId = $2, building.negotiationStatus = 'PENDIENTE'
WHERE building._documentType = 'building' AND building.id = $1
`

const pullBuildingOutOfFreezerQuery = bucketName => `
UPDATE ${bucketName} building
UNSET building.assignedAgentId, building.negotiationStatus, building.lead
WHERE building._documentType = 'building' AND building.id IN $1
`

export class BuildingsRepository extends CouchbaseRepository<BuildingProps> {
  async setBuildingFeaturedOwner (buildingId, ownerId) {
    await this.couchbaseAdapter.queryAsync(
      setBuildingFeaturedOwner(this.bucketName),
      [ buildingId, ownerId ]
    )
  }

  async assignBuildingToAgent (buildingId, agentId) {
    await this.couchbaseAdapter.queryAsync(
      assignBuildingToAgentQuery(this.bucketName), [ buildingId, agentId ]
    )
  }

  async pullBuildingsOutOfFreezer (buildingIds) {
    await this.couchbaseAdapter.queryAsync(
      pullBuildingOutOfFreezerQuery(this.bucketName), [ buildingIds ]
    )
  }

  struct () {
    return Building
  }
}
