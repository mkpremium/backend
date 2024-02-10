import { Router } from 'express'
import {
  closeSellStockControllerFactory,
  createCancelSaleController,
  createSellPurchasedStockController,
  getRankingController,
  purchaseStockControllerFactory,
  updatePurchaseStockFactory,
  updateSellStockControllerFactory
} from './controllers'
import type { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import type { StockService } from './service/StockService'
import type { AwilixContainer } from 'awilix'
import type { StockSalesService } from './service/stock-sales.service'

export function addStockRoutes (
  propertyManagerRankingService: PropertyManagerRankingService,
  stockSalesService: StockSalesService,
  stockService: StockService,
  container: AwilixContainer
) {
  const router = Router()

  router.post('/purchase', purchaseStockControllerFactory(stockSalesService))
  router.put('/purchase',
    container.resolve('updatePurchaseStockController') as ReturnType<typeof updatePurchaseStockFactory>)

  router.post('/sell', createSellPurchasedStockController(stockSalesService))
  router.put('/sell',
    container.resolve('updateSellStockController') as ReturnType<typeof updateSellStockControllerFactory>)
  router.post('/sell/cancel', createCancelSaleController(stockService))

  router.post('/close', container.resolve('closeSellStockController') as ReturnType<typeof closeSellStockControllerFactory>)

  router.get('/ranking', getRankingController(propertyManagerRankingService))

  return router
}
