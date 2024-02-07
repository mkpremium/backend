import { Router } from 'express'
import {
  createCancelSaleController,
  closeSellStockController,
  purchaseStockControllerFactory,
  updatePurchaseStockController,
  updateSellStockController,
  getRankingController,
  createSellPurchasedStockController
} from './controllers'
import type { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import type { StockSalesService } from './service/StockSalesService'
import type { StockService } from './service/StockService'

export function addStockRoutes (
  propertyManagerRankingService: PropertyManagerRankingService,
  stockSalesService: StockSalesService,
  stockService: StockService
) {
  const router = Router()

  router.post('/purchase', purchaseStockControllerFactory(stockService))
  router.put('/purchase', updatePurchaseStockController)

  router.post('/sell', createSellPurchasedStockController(stockSalesService))
  router.put('/sell', updateSellStockController)
  router.post('/sell/cancel', createCancelSaleController(stockService))

  router.post('/close', closeSellStockController)

  router.get('/ranking', getRankingController(propertyManagerRankingService))

  return router
}
