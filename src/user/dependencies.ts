import { aliasTo, asClass, asFunction } from 'awilix'
import { AddFavoriteBuildingService } from './service/add-favorite-building.service'
import { DeleteFavoriteBuildingService } from './service/delete-favorite-building.service'
import { UserBlockedAvailabilityService } from './service/user-blocked-availability.service'
import { removeFavoriteForNoSaleBuildings } from './event-listener/remove-favorite-for-no-sale-buildings'
import { CouchbaseUsersRepository } from './repository/couchbase-users.repository'
import { OperatorRepository } from '../operator/models'
import { LoginService } from './service/login.service'
import { createLoginController } from '../operator/controllers'
import { PostgresUserRepository } from './repository/postgres-user.repository'
import { AuthTokenIssuerService } from './service/auth-token-issuer.service'
import { createAddUserController } from './controllers'

export const setupUserDependencies = container => {
  const usePostgres = container.resolve('usePostgres')
  container.register({
    operatorRepository: asClass(OperatorRepository).singleton(),
    postgresUsersRepository: asClass(PostgresUserRepository).classic().singleton(),
    couchbaseUsersRepository: asClass(CouchbaseUsersRepository).classic().singleton(),
    usersRepository: aliasTo(usePostgres ? 'postgresUsersRepository' : 'couchbaseUsersRepository'),

    addUserController: asFunction(createAddUserController).singleton(),
    authTokenIssuerService: asClass(AuthTokenIssuerService).classic().singleton(),
    addFavoriteBuildingService: asClass(AddFavoriteBuildingService).classic().singleton(),
    deleteFavoriteBuildingService: asClass(DeleteFavoriteBuildingService).classic().singleton(),
    loginService: asClass(LoginService).classic().singleton(),
    removeFavoriteForNoSaleBuildings: asFunction(removeFavoriteForNoSaleBuildings).singleton(),
    userBlockedAvailabilityService: asClass(UserBlockedAvailabilityService).singleton(),

    loginController: asFunction(createLoginController).singleton(),
  })
}
