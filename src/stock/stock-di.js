import { StockService } from './service/StockService'
import { asClass } from 'awilix'
import { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import { StockSalesService } from './service/StockSalesService'
import { PropertyManagerRepository } from '../property-manager/PropertyManagerRepository'
import { StockRepository } from './StockRepository'
import { StockRepository as LegacyStockRepository } from './models'

export const setupStockDependencies = awilixContainer => {
  awilixContainer.register({
    stockService: asClass(StockService).classic().singleton(),
    propertyManagerRankingService: asClass(PropertyManagerRankingService).classic().singleton(),
    stockSalesService: asClass(StockSalesService).classic().singleton(),

    stockRepository: asClass(StockRepository).classic().singleton(),
    legacyStockRepository: asClass(LegacyStockRepository).singleton(),
    propertyManagersRepository: asClass(PropertyManagerRepository).classic().singleton()
  })
}
