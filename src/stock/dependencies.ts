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
      legacyStockRepository: asValue(null),
      propertyManagersRepository: asValue(null),
      stockService: asValue(null)
    })
  } else {
    const { PropertyManagerRepository } = await import('../property-manager/PropertyManagerRepository')
    const { StockRepository } = await import('./StockRepository')
    const { StockRepository: LegacyStockRepository } = await import('./models')
    const { StockService } = await import('./service/StockService')

    container.register({
      stockRepository: asClass(StockRepository).classic().singleton(),
      legacyStockRepository: asClass(LegacyStockRepository).singleton(),
      propertyManagersRepository: asClass(PropertyManagerRepository).classic().singleton(),
      stockService: asClass(StockService).classic().singleton()
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
