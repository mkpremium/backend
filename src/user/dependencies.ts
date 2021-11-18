import { asClass, asFunction } from 'awilix'
import { UsersRepository } from './repository/users.repository'
import { AddFavoriteBuildingService } from './service/add-favorite-building.service'
import { DeleteFavoriteBuildingService } from './service/delete-favorite-building.service'
import { UserBlockedAvailabilityService } from './service/user-blocked-availability.service'
import { removeFavoriteForNoSaleBuildings } from './event-listener/remove-favorite-for-no-sale-buildings'

export const setupUserDependencies = container => {
  container.register({
    usersRepository: asClass(UsersRepository).classic().singleton(),
    addFavoriteBuildingService: asClass(AddFavoriteBuildingService).classic().singleton(),
    deleteFavoriteBuildingService: asClass(DeleteFavoriteBuildingService).classic().singleton(),
    userBlockedAvailabilityService: asClass(UserBlockedAvailabilityService).singleton(),
    removeFavoriteForNoSaleBuildings: asFunction(removeFavoriteForNoSaleBuildings).singleton()
  })
}
