export class DeleteFavoriteBuildingService {
  constructor (usersRepository) {
    this.usersRepository = usersRepository
  }

  deleteFavoriteBuilding (userId, buildingId) {
    return this.usersRepository.removeFavoriteBuildingToUserOfId(userId, buildingId)
  }
}
