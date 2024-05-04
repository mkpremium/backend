import { wrap } from 'express-promise-wrap'
import type { StockSalesService } from './service/stock-sales.service'

export function updatePurchaseStockFactory (stockSalesService: StockSalesService) {
  return wrap(async function updatePurchaseStockController (req, res) {
    const stock = await stockSalesService.updatePurchaseStock(req.body, req.user.id)
    res.status(201).json(stock)
  })
}

export function createSellPurchasedStockController (stockSalesService: StockSalesService) {
  return async (req, res) => {
    const stock = await stockSalesService.sellStock(req.body, req.user.id)
    res.status(201).json(stock)
  }
}

export function updateSellStockControllerFactory (stockSalesService: StockSalesService) {
  return wrap(
    async function updateSellStockController (req, res) {
      const stock = await stockSalesService.updateSellStock(req.body, req.user.id)
      res.status(201).json(stock)
    }
  )
}

export function closeSellStockControllerFactory (stockSalesService: StockSalesService) {
  return wrap(async function closeSellStockController (req, res) {
    const stock = await stockSalesService.closeSellStock(req.body.buildingId, req.user.id)
    res.status(201).json(stock)
  })
}

export function purchaseStockControllerFactory (stockSalesService: StockSalesService) {
  return wrap(async (req, res) => {
    const stock = await stockSalesService.purchaseBuilding(req.body, req.user.id)
    res.status(201).json(stock)
  })
}

export function cancelSaleControllerFactory (stockSalesService: StockSalesService) {
  return wrap(async (req, res) => {
    const stock = await stockSalesService.cancelSale(req.body.buildingId, req.user.id)
    res.status(200).json(stock)
  })
}
