import jwt from '../middleware/jwt'
import { userRoutes } from './routes'
import { asClass } from 'awilix'
import { UsersRepository } from './repository/users.repository'
import { AddFavoriteBuildingService } from './service/add-favorite-building.service'
import { DeleteFavoriteBuildingService } from './service/delete-favorite-building.service'
import { UserBlockedAvailabilityService } from './service/user-blocked-availability.service'

export const setupUserDependencies = awilixContainer => {
  awilixContainer.register({
    usersRepository: asClass(UsersRepository).classic(),
    addFavoriteBuildingService: asClass(AddFavoriteBuildingService).classic(),
    deleteFavoriteBuildingService: asClass(DeleteFavoriteBuildingService).classic(),
    userBlockedAvailabilityService: asClass(UserBlockedAvailabilityService)
  })
}

export const setupUserRoutes = (app, awilixContainer) => {
  const secured = jwt()

  app.use('/', secured, userRoutes(awilixContainer))
}
