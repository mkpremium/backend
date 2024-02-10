import { aliasTo, asClass, asFunction, type AwilixContainer } from 'awilix'
import { UserBlockedAvailabilityService } from './service/user-blocked-availability.service'
import { removeFavoriteForNoSaleBuildings } from './event-listener/remove-favorite-for-no-sale-buildings'
import { LoginService } from './service/login.service'
import {
  createLoginController,
  listOperatorControllerFactory,
  updateOperatorControllerFactory
} from '../operator/controllers'
import { PostgresUserRepository } from './repository/postgres-user.repository'
import { AuthTokenIssuerService } from './service/auth-token-issuer.service'
import { AddOperatorService } from './service/add-operator.service'
import { importOperatorCommandHandler } from '../infrastructure/postgres/import-operator-command-handler'

export const setupUserDependencies = async (container: AwilixContainer) => {
  container.register({
    postgresUsersRepository: asClass(PostgresUserRepository).classic().singleton(),
    usersRepository: aliasTo('postgresUsersRepository'),

    addOperatorService: asClass(AddOperatorService).classic().singleton(),
    authTokenIssuerService: asClass(AuthTokenIssuerService).classic().singleton(),
    loginService: asClass(LoginService).classic().singleton(),
    removeFavoriteForNoSaleBuildings: asFunction(removeFavoriteForNoSaleBuildings).singleton(),
    userBlockedAvailabilityService: asClass(UserBlockedAvailabilityService).singleton(),

    importOperatorCommandHandler: asFunction(importOperatorCommandHandler).singleton(),

    loginController: asFunction(createLoginController).singleton(),
    updateOperatorController: asFunction(updateOperatorControllerFactory).singleton(),
    listOperatorController: asFunction(listOperatorControllerFactory).singleton()
  })
}
