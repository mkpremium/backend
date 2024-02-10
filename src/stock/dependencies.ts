import { asClass, asFunction, asValue, type AwilixContainer } from 'awilix'
import { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import {
  closeSellStockControllerFactory,
  updatePurchaseStockFactory,
  updateSellStockControllerFactory
} from './controllers'
import { StockSalesService } from './service/stock-sales.service'
import { StockRepository } from './StockRepository'

export async function setupStockDependencies (container: AwilixContainer, usePostgres: boolean) {
  if (usePostgres) {
    container.register({
      propertyManagersRepository: asValue(null)
    })
  } else {
    const { PropertyManagerRepository } = await import('../property-manager/PropertyManagerRepository')

    container.register({
      propertyManagersRepository: asClass(PropertyManagerRepository).classic().singleton()
    })
  }

  container.register({
    stockRepository: asClass(StockRepository).classic().singleton(),
    stockSalesService: asClass(StockSalesService).classic().singleton(),
    propertyManagerRankingService: asClass(PropertyManagerRankingService).classic().singleton(),
    updatePurchaseStockController: asFunction(updatePurchaseStockFactory).classic(),
    updateSellStockController: asFunction(updateSellStockControllerFactory).classic(),
    closeSellStockController: asFunction(closeSellStockControllerFactory).classic()
  })
}
