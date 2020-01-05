import { wrap } from 'express-promise-wrap'
import {
  cancelSellStock,
  closeSellStock,
  createPurchaseStock,
  getProfitGoalOperatorsRanking,
  sellPurchasedStock,
  updatePurchaseStock,
  updateSellStock
} from './application'

async function createPurchaseStockFromRequest (req, res) {
  const stock = await createPurchaseStock(req.body, req.user.id)
  res.status(201).json(stock)
}

async function updatePurchaseStockFromRequest (req, res) {
  const stock = await updatePurchaseStock(req.body, req.user.id)
  res.status(201).json(stock)
}

async function sellPurchasedStockFromRequest (req, res) {
  const stock = await sellPurchasedStock(req.body, req.user.id)
  res.status(201).json(stock)
}

async function updateSellStockFromRequest (req, res) {
  const stock = await updateSellStock(req.body, req.user.id)
  res.status(201).json(stock)
}

async function cancelSellStockFromRequest (req, res) {
  const stock = await cancelSellStock(req.body)
  return res.status(200).json(stock)
}

async function closeSellStockFromRequest (req, res) {
  const stock = await closeSellStock(req.body, req.user.id)
  res.status(201).json(stock)
}

async function getProfitsRanking (req, res) {
  const profitsRanking = await getProfitGoalOperatorsRanking()
  res.status(201).json(profitsRanking)
}

export const createPurchaseStockController = wrap(createPurchaseStockFromRequest)
export const updatePurchaseStockController = wrap(updatePurchaseStockFromRequest)
export const sellPurchasedStockController = wrap(sellPurchasedStockFromRequest)
export const updateSellStockController = wrap(updateSellStockFromRequest)
export const closeSellStockController = wrap(closeSellStockFromRequest)
export const cancelSellStockController = wrap(cancelSellStockFromRequest)
export const getProfitsRakningController = wrap(getProfitsRanking)
