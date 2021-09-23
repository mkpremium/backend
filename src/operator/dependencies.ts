import { asClass, asFunction, AwilixContainer } from 'awilix'
import { removeFavoriteForNoSaleBuildings } from './event-listener/remove-favorite-for-no-sale-buildings'
import { UsersRepository } from './users.repository'

export function setupOperatorDependencies(container: AwilixContainer) {
  container.register({
    removeFavoriteForNoSaleBuildings: asFunction(removeFavoriteForNoSaleBuildings).singleton(),
    usersRepository: asClass(UsersRepository).classic().singleton(),
  })
}
