import { Router } from 'express'
import {
  closeSellStockControllerFactory,
  cancelSaleControllerFactory,
  createSellPurchasedStockController,
  getRankingController,
  purchaseStockControllerFactory,
  updatePurchaseStockFactory,
  updateSellStockControllerFactory
} from './controllers'
import type { FlipperRankingService } from '../flipper/service/flipper-ranking.service'
import type { AwilixContainer } from 'awilix'
import type { StockSalesService } from './service/stock-sales.service'

export function addStockRoutes (
  flipperRankingService: FlipperRankingService,
  stockSalesService: StockSalesService,
  container: AwilixContainer
) {
  const router = Router()

  router.post('/purchase', purchaseStockControllerFactory(stockSalesService))
  router.put('/purchase',
    container.resolve('updatePurchaseStockController') as ReturnType<typeof updatePurchaseStockFactory>)

  router.post('/sell', createSellPurchasedStockController(stockSalesService))
  router.put('/sell',
    container.resolve('updateSellStockController') as ReturnType<typeof updateSellStockControllerFactory>)
  router.post('/sell/cancel', cancelSaleControllerFactory(stockSalesService))

  router.post('/close', container.resolve('closeSellStockController') as ReturnType<typeof closeSellStockControllerFactory>)

  router.get('/ranking', getRankingController(flipperRankingService))

  return router
}
