export class AddFavoriteBuildingService {
  constructor (usersRepository) {
    this.usersRepository = usersRepository
  }

  async addFavoriteBuilding (userId, buildingId) {
    await this.usersRepository.addFavoriteBuildingToUserOfId(userId, buildingId)
    return true
  }
}
