export const createMeController = usersRepository => {
  return async (req, res) => {
    const { favouriteBuildings, featuredOwners } = await usersRepository.getUserOfId(req.user.operator.id)
    res.json({
      featuredOwners,
      favouriteBuildings
    })
  }
}

export const createAddFavoritesController = addFavoriteBuildingService => {
  return async (req, res) => {
    await addFavoriteBuildingService.addFavoriteBuilding(req.user.operator.id, req.body.buildingId)
    res.sendStatus(201)
  }
}
