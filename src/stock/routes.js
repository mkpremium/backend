import { Router } from 'express'
import {
  createCancelSaleController,
  closeSellStockController,
  createPurchaseStockController,
  updatePurchaseStockController,
  updateSellStockController,
  getRankingController,
  createSellPurchasedStockController
} from './controllers'

export const addStockRoutes = (propertyManagerRankingService, stockSalesService, stockService) => {
  const router = Router()

  router.post('/purchase', createPurchaseStockController(stockService))
  router.put('/purchase', updatePurchaseStockController)

  router.post('/sell', createSellPurchasedStockController(stockSalesService))
  router.put('/sell', updateSellStockController)
  router.post('/sell/cancel', createCancelSaleController(stockService))

  router.post('/close', closeSellStockController)


  router.get('/ranking', getRankingController(propertyManagerRankingService))

  return router
}
