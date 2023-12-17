import { UsersRepository } from './repository/users.repository'

export const createMeController = (usersRepository: UsersRepository) => {
  return async (req, res) => {
    const {
      favoriteBuildings,
      restringedHours,
      signatures,
      profile,
      maxLine
    } = await usersRepository.get(req.user.operator.id)
    res.json({
      favoriteBuildings,
      restringedHours,
      signatures,
      maxLine,
      queueId: profile && !!profile.queueId ? profile.queueId : undefined,
      firstName: profile.firstName,
      lastName: profile.lastName
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


export function createAddUserController () {
  return function (req, res) {
    res.status(501).send()
  }
}
