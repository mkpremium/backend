import { asClass, asFunction, type AwilixContainer } from 'awilix'
import {
  closeSellStockControllerFactory,
  updatePurchaseStockFactory,
  updateSellStockControllerFactory
} from './controllers'
import { StockSalesService } from './service/stock-sales.service'
import { StockRepository } from './StockRepository'
import { PropertyManagerRepository } from '../property-manager/PropertyManagerRepository'

export async function setupStockDependencies (container: AwilixContainer) {
  container.register({
    stockRepository: asClass(StockRepository).classic().singleton(),
    stockSalesService: asClass(StockSalesService).classic().singleton(),
    updatePurchaseStockController: asFunction(updatePurchaseStockFactory).classic(),
    updateSellStockController: asFunction(updateSellStockControllerFactory).classic(),
    closeSellStockController: asFunction(closeSellStockControllerFactory).classic(),
    propertyManagersRepository: asClass(PropertyManagerRepository).classic().singleton()
  })
}
