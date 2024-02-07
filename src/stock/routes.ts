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
import type { CouchbaseStockSalesService } from './service/couchbase-stock-sales.service'
import type { StockService } from './service/StockService'
import type { AwilixContainer } from 'awilix'

export function addStockRoutes (
  propertyManagerRankingService: PropertyManagerRankingService,
  stockSalesService: CouchbaseStockSalesService,
  stockService: StockService,
  container: AwilixContainer
) {
  const router = Router()

  router.post('/purchase', purchaseStockControllerFactory(stockService))
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
