import { Router } from 'express'
import {
  closeSellStockController,
  createCancelSaleController,
  createSellPurchasedStockController,
  getRankingController,
  purchaseStockControllerFactory, updatePurchaseStockFactory,
  updateSellStockController
} from './controllers'
import type { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import type { StockSalesService } from './service/StockSalesService'
import type { StockService } from './service/StockService'
import type { AwilixContainer } from 'awilix'

export function addStockRoutes (
  propertyManagerRankingService: PropertyManagerRankingService,
  stockSalesService: StockSalesService,
  stockService: StockService,
  container: AwilixContainer
) {
  const router = Router()

  router.post('/purchase', purchaseStockControllerFactory(stockService))
  router.put('/purchase', container.resolve('updatePurchaseStockController') as ReturnType<typeof updatePurchaseStockFactory>)

  router.post('/sell', createSellPurchasedStockController(stockSalesService))
  router.put('/sell', updateSellStockController)
  router.post('/sell/cancel', createCancelSaleController(stockService))

  router.post('/close', closeSellStockController)

  router.get('/ranking', getRankingController(propertyManagerRankingService))

  return router
}
