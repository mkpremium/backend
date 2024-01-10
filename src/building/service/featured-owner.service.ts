import { CouchbaseBuildingsRepository } from '../repository/couchbase-building.repository'

export class FeaturedOwnerService {
  constructor (private couchbaseBuildingsRepository: CouchbaseBuildingsRepository) {
  }

  async setBuildingFeaturedOwner (buildingId, ownerId) {
    await this.couchbaseBuildingsRepository.setBuildingFeaturedOwner(buildingId, ownerId)
  }
}
