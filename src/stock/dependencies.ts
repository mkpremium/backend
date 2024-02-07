import { asClass, asValue, type AwilixContainer } from 'awilix'
import { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import { updatePurchaseStockFactory } from './controllers'

export async function setupStockDependencies (container: AwilixContainer, usePostgres: boolean) {
  if (usePostgres) {
    container.register({
      stockRepository: asValue(null),
      legacyStockRepository: asValue(null),
      propertyManagersRepository: asValue(null),
      stockService: asValue(null),
      stockSalesService: asValue(null)
    })
  } else {
    const { PropertyManagerRepository } = await import('../property-manager/PropertyManagerRepository')
    const { StockRepository } = await import('./StockRepository')
    const { StockRepository: LegacyStockRepository } = await import('./models')
    const { StockService } = await import('./service/StockService')
    const { StockSalesService } = await import('./service/StockSalesService')

    container.register({
      stockRepository: asClass(StockRepository).classic().singleton(),
      legacyStockRepository: asClass(LegacyStockRepository).singleton(),
      propertyManagersRepository: asClass(PropertyManagerRepository).classic().singleton(),
      stockService: asClass(StockService).classic().singleton(),
      stockSalesService: asClass(StockSalesService).classic().singleton(),

      //   controllers
      updatePurchaseStockController: asValue(updatePurchaseStockFactory)
    })
  }

  container.register({
    propertyManagerRankingService: asClass(PropertyManagerRankingService).classic().singleton()
  })
}
