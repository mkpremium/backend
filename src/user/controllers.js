export const createMeController = usersRepository => {
  return async (req, res) => {
    const {
      favoriteBuildings,
      featuredOwners,
      restringedHours,
      signatures,
      profile,
      maxLine
    } = await usersRepository.get(req.user.operator.id)
    res.json({
      featuredOwners,
      favoriteBuildings,
      restringedHours,
      signatures,
      maxLine,
      queueId: profile && !!profile.queueId ? profile.queueId : undefined
    })
  }
}

export const createAddFavoritesController = addFavoriteBuildingService => {
  return async (req, res) => {
    await addFavoriteBuildingService.addFavoriteBuilding(req.user.operator.id, req.body.buildingId)
    res.status(201).json()
  }
}

export const createDeleteFavoriteBuildingController = deleteFavoriteBuildingService => {
  return async (req, res) => {
    await deleteFavoriteBuildingService.deleteFavoriteBuilding(req.user.operator.id, req.params.buildingId)
    res.json()
  }
}
