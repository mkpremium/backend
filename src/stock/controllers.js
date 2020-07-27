import { wrap } from 'express-promise-wrap'
import {
  closeSellStock,
  updatePurchaseStock,
  updateSellStock
} from './application'

export const getRankingController = (propertyManagerRankingService) => {
  return wrap(async (req, res) => {
    const ranking = await propertyManagerRankingService.ranking()
    res.status(201).json(ranking)
  })
}

async function updatePurchaseStockFromRequest (req, res) {
  const stock = await updatePurchaseStock(req.body, req.user.id)
  res.status(201).json(stock)
}

export function createSellPurchasedStockController (stockSalesService) {
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

/**
 * @param stockService StockService
 */
export const createPurchaseStockController = stockService => {
  return wrap(async (req, res) => {
    const stock = await stockService.purchaseBuilding(req.body, req.user.id)
    res.status(201).json(stock)
  })
}

export const createCancelSaleController = stockService => {
  return wrap(async (req, res) => {
    const stock = await stockService.cancelSale(req.body.buildingId, req.user.id)
    res.status(200).json(stock)
  })
}

export const updatePurchaseStockController = wrap(updatePurchaseStockFromRequest)
export const updateSellStockController = wrap(updateSellStockFromRequest)
export const closeSellStockController = wrap(closeSellStockFromRequest)
