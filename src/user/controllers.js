export const createMeController = usersRepository => {
  return async (req, res) => {
    const { favoriteBuildings, featuredOwners, restringedHours } = await usersRepository.getUserOfId(req.user.operator.id)
    res.json({
      featuredOwners,
      favoriteBuildings,
      restringedHours
    })
  }
}

export const createAddFavoritesController = addFavoriteBuildingService => {
  return async (req, res) => {
    await addFavoriteBuildingService.addFavoriteBuilding(req.user.operator.id, req.body.buildingId)
    res.sendStatus(201)
  }
}
