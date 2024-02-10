import { asClass, asFunction, asValue, type AwilixContainer } from 'awilix'
import { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import {
  closeSellStockControllerFactory,
  updatePurchaseStockFactory,
  updateSellStockControllerFactory
} from './controllers'
import { StockSalesService } from './service/stock-sales.service'

export async function setupStockDependencies (container: AwilixContainer, usePostgres: boolean) {
  if (usePostgres) {
    container.register({
      stockRepository: asValue(null),
      propertyManagersRepository: asValue(null)
    })
  } else {
    const { PropertyManagerRepository } = await import('../property-manager/PropertyManagerRepository')
    const { StockRepository } = await import('./StockRepository')

    container.register({
      stockRepository: asClass(StockRepository).classic().singleton(),
      propertyManagersRepository: asClass(PropertyManagerRepository).classic().singleton()
    })
  }

  container.register({
    stockSalesService: asClass(StockSalesService).classic().singleton(),
    propertyManagerRankingService: asClass(PropertyManagerRankingService).classic().singleton(),
    updatePurchaseStockController: asFunction(updatePurchaseStockFactory).classic(),
    updateSellStockController: asFunction(updateSellStockControllerFactory).classic(),
    closeSellStockController: asFunction(closeSellStockControllerFactory).classic()
  })
}
