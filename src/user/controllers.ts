import { UsersRepository } from './repository/users.repository'
import { FlipperFavoritesBuildingsService } from "../flipper/service/flipper-favorites-buildings.service";

export const meControllerFactory = (usersRepository: UsersRepository) => {
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

export const addFavoritesControllerFactory = (flipperFavoritesBuildingsService: FlipperFavoritesBuildingsService) => {
  return async (req, res) => {
    await flipperFavoritesBuildingsService.addFavoriteBuildingToUserOfId(req.user.operator.id, req.body.buildingId)
    res.status(201).json()
  }
}

export const deleteFavoriteBuildingControllerFactory = (flipperFavoritesBuildingsService: FlipperFavoritesBuildingsService) => {
  return async (req, res) => {
    await flipperFavoritesBuildingsService.removeFavoriteBuildingToUserOfId(req.user.operator.id, req.params.buildingId)
    res.json()
  }
}
