export class FeaturedOwnerService {
  constructor (propertyManagerRepository) {
    this.propertyManagerRepository = propertyManagerRepository
  }

  async setFeaturedOwnerForBuildingAndPropertyManager (propertyAgentId, buildingId, ownerId) {
    await this.propertyManagerRepository.setFeaturedOwnerForBuildingAndPropertyManager(propertyAgentId, buildingId, ownerId)
    return true
  }
}
