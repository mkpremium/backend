import { wrap } from 'express-promise-wrap'
import { closeSellStock, updateSellStock } from './application'
import type { StockService } from './service/StockService'
import type { PropertyManagerRankingService } from '../property-manager/PropertyManagerRankingService'
import type { StockSalesService } from './service/StockSalesService'

export const getRankingController = (propertyManagerRankingService: PropertyManagerRankingService) => {
  return wrap(async (req, res) => {
    const ranking = await propertyManagerRankingService.ranking()
    res.status(201).json(ranking)
  })
}

export function updatePurchaseStockFactory (updatePurchaseStock: (data: any, userId: number) => Promise<any>) {
  return wrap(async function updatePurchaseStockController (req, res) {
    const stock = await updatePurchaseStock(req.body, req.user.id)
    res.status(201).json(stock)
  })
}

export function createSellPurchasedStockController (stockSalesService: StockSalesService) {
  return async (req, res) => {
    const stock = await stockSalesService.sellStock(req.body, req.user.id)
    res.status(201).json(stock)
  }
}

async function updateSellStockFromRequest (req, res) {
  const stock = await updateSellStock(req.body, req.user.id)
  res.status(201).json(stock)
}

async function closeSellStockFromRequest (req, res) {
  const stock = await closeSellStock(req.body, req.user.id)
  res.status(201).json(stock)
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

export const updateSellStockController = wrap(updateSellStockFromRequest)
export const closeSellStockController = wrap(closeSellStockFromRequest)
