import { asFunction, AwilixContainer } from 'awilix'
import { removeFavoriteForNoSaleBuildings } from './event-listener/remove-favorite-for-no-sale-buildings'

export function setupOperatorDependencies(container: AwilixContainer) {
  container.register({
    removeFavoriteForNoSaleBuildings: asFunction(removeFavoriteForNoSaleBuildings).singleton(),
  })
}
