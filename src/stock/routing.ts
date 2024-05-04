import { Router } from 'express'
import {
  cancelSaleControllerFactory,
  closeSellStockControllerFactory,
  createSellPurchasedStockController,
  purchaseStockControllerFactory,
  updatePurchaseStockFactory,
  updateSellStockControllerFactory
} from './controllers'

export const setupStockRouter = async (app, container, secured) => {
  const router = Router()
  const stockSalesService = container.resolve('stockSalesService')

  router.post('/purchase', purchaseStockControllerFactory(stockSalesService))
  router.put('/purchase',
    container.resolve('updatePurchaseStockController') as ReturnType<typeof updatePurchaseStockFactory>)

  router.post('/sell', createSellPurchasedStockController(stockSalesService))
  router.put('/sell',
    container.resolve('updateSellStockController') as ReturnType<typeof updateSellStockControllerFactory>)
  router.post('/sell/cancel', cancelSaleControllerFactory(stockSalesService))

  router.post('/close', container.resolve('closeSellStockController') as ReturnType<typeof closeSellStockControllerFactory>)

  app.use('/stock', secured, router)
}
