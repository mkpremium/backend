export class DeleteFavoriteBuildingService {
  constructor (usersRepository) {
    this.usersRepository = usersRepository
  }

  async deleteFavoriteBuilding (userId, buildingId) {
    await this.usersRepository.removeFavoriteBuildingToUserOfId(userId, buildingId)
  }
}
