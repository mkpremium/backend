import { Router } from 'express'
import {
  closeSellStockControllerFactory,
  cancelSaleControllerFactory,
  createSellPurchasedStockController,
  purchaseStockControllerFactory,
  updatePurchaseStockFactory,
  updateSellStockControllerFactory
} from './controllers'
import type { AwilixContainer } from 'awilix'
import type { StockSalesService } from './service/stock-sales.service'

export function addStockRoutes (
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

  return router
}
