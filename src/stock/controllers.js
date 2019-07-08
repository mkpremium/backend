import {wrap} from 'express-promise-wrap';
import {closeSellStock, createPurchaseStock, getProfitGoalOperatorsRanking, sellPurchasedStock} from './application';

async function createPurchaseStockFromRequest(req, res) {
  const stock = await createPurchaseStock(req.body, req.user.id);
  res.status(201).json(stock);
}

async function sellPurchasedStockFromRequest(req, res) {
  const stock = await sellPurchasedStock(req.body, req.user.id);
  res.status(201).json(stock);
}

async function closeSellStockFromRequest(req, res) {
  const stock = await closeSellStock(req.body, req.user.id);
  res.status(201).json(stock);
}

async function getProfitsRanking(req,res){
  const profitsRanking = await getProfitGoalOperatorsRanking();
  res.status(201).json(profitsRanking);
}

export const createPurchaseStockController = wrap(createPurchaseStockFromRequest);
export const sellPurchasedStockController = wrap(sellPurchasedStockFromRequest);
export const closeSellStockController = wrap(closeSellStockFromRequest);
export const getProfitsRakningController = wrap(getProfitsRanking);
