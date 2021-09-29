import jwt from '../middleware/jwt'
import { removeFavoriteForNoSaleBuildings } from './event-listener/remove-favorite-for-no-sale-buildings'
import { userRoutes } from './routes'
import { asClass, asFunction } from 'awilix'
import { UsersRepository } from './repository/users.repository'
import { AddFavoriteBuildingService } from './service/add-favorite-building.service'
import { DeleteFavoriteBuildingService } from './service/delete-favorite-building.service'
import { UserBlockedAvailabilityService } from './service/user-blocked-availability.service'

export const setupUserDependencies = awilixContainer => {
  awilixContainer.register({
    usersRepository: asClass(UsersRepository).classic().singleton(),
    addFavoriteBuildingService: asClass(AddFavoriteBuildingService).classic().singleton(),
    deleteFavoriteBuildingService: asClass(DeleteFavoriteBuildingService).classic().singleton(),
    userBlockedAvailabilityService: asClass(UserBlockedAvailabilityService).singleton(),
    removeFavoriteForNoSaleBuildings: asFunction(removeFavoriteForNoSaleBuildings).singleton()
  })
}

export const setupUserRoutes = (app, awilixContainer) => {
  const secured = jwt()

  app.use('/', secured, userRoutes(awilixContainer))
}
