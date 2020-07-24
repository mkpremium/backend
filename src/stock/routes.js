import { Router } from 'express'
import {
  cancelSellStockController,
  closeSellStockController,
  createPurchaseStockController,
  updatePurchaseStockController,
  updateSellStockController,
  getRankingController, createSellPurchasedStockController
} from './controllers'

export const addStockRoutes = (propertyManagerRankingService, stockSalesService, createPurchaseStockService) => {
  const router = Router()

  router.post('/purchase', createPurchaseStockController(createPurchaseStockService))
  router.put('/purchase', updatePurchaseStockController)

  router.post('/sell', createSellPurchasedStockController(stockSalesService))
  router.put('/sell', updateSellStockController)
  router.post('/sell/cancel', cancelSellStockController)

  router.post('/close', closeSellStockController)


  router.get('/ranking', getRankingController(propertyManagerRankingService))

  return router
}
