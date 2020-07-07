export const createMeController = usersRepository => {
  return async (req, res) => {
    const { favoriteBuildings, featuredOwners, restringedHours, signatures } = await usersRepository.getUserOfId(req.user.operator.id)
    res.json({
      featuredOwners,
      favoriteBuildings,
      restringedHours,
      signatures
    })
  }
}

export const createAddFavoritesController = addFavoriteBuildingService => {
  return async (req, res) => {
    await addFavoriteBuildingService.addFavoriteBuilding(req.user.operator.id, req.body.buildingId)
    res.sendStatus(201)
  }
}

export const createDeleteFavoriteBuildingController = deleteFavoriteBuildingService => {
  return async (req, res) => {
    await deleteFavoriteBuildingService.deleteFavoriteBuilding(req.user.operator.id, req.params.buildingId)
    res.sendStatus(200)
  }
}
