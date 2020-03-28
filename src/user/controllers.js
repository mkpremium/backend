export const createMeController = usersRepository => {
  return async (req, res) => {
    const user = await usersRepository.getUserOfId(req.user.operator.id)
    res.json({
      featuredOwners: user.featuredOwners
    })
  }
}

export const createAddFavoritesController = addFavoriteBuildingService => {
  return async (req, res) => {
    await addFavoriteBuildingService.addFavoriteBuilding(req.user.operator.id, req.body.buildingId)
    res.sendStatus(201)
  }
}
