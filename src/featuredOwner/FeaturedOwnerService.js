export class FeaturedOwnerService {
  constructor (buildingsRepository) {
    this.buildingsRepository = buildingsRepository
  }

  async setBuildingFeaturedOwner (buildingId, ownerId) {
    await this.buildingsRepository.setBuildingFeaturedOwner(buildingId, ownerId)
  }
}
