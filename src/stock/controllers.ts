import { wrap } from 'express-promise-wrap'
import { closeSellStock } from './application'
import type { StockService } from './service/StockService'
import type { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import type { StockSalesService } from './service/stock-sales.service'

export const getRankingController = (propertyManagerRankingService: PropertyManagerRankingService) => {
  return wrap(async (req, res) => {
    const ranking = await propertyManagerRankingService.ranking()
    res.status(201).json(ranking)
  })
}

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

export function closeSellStockControllerFactory () {
  return wrap(async function closeSellStockController (req, res) {
    const stock = await closeSellStock(req.body, req.user.id)
    res.status(201).json(stock)
  })
}

export function purchaseStockControllerFactory (stockService: StockService) {
  return wrap(async (req, res) => {
    const stock = await stockService.purchaseBuilding(req.body, req.user.id)
    res.status(201).json(stock)
  })
}

export function createCancelSaleController (stockService: StockService) {
  return wrap(async (req, res) => {
    const stock = await stockService.cancelSale(req.body.buildingId, req.user.id)
    res.status(200).json(stock)
  })
}
