import { aliasTo, asClass, asFunction } from 'awilix'
import { AddFavoriteBuildingService } from './service/add-favorite-building.service'
import { DeleteFavoriteBuildingService } from './service/delete-favorite-building.service'
import { UserBlockedAvailabilityService } from './service/user-blocked-availability.service'
import { removeFavoriteForNoSaleBuildings } from './event-listener/remove-favorite-for-no-sale-buildings'
import { CouchbaseUsersRepository } from './repository/couchbase-users.repository'

export const setupUserDependencies = container => {
  container.register({
    couchbaseUsersRepository: asClass(CouchbaseUsersRepository).classic().singleton(),
    usersRepository: aliasTo('couchbaseUsersRepository'),
    addFavoriteBuildingService: asClass(AddFavoriteBuildingService).classic().singleton(),
    deleteFavoriteBuildingService: asClass(DeleteFavoriteBuildingService).classic().singleton(),
    userBlockedAvailabilityService: asClass(UserBlockedAvailabilityService).singleton(),
    removeFavoriteForNoSaleBuildings: asFunction(removeFavoriteForNoSaleBuildings).singleton()
  })
}
