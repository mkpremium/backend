import {wrap} from 'express-promise-wrap';
import {StockRepository} from './models';

export async function addBuildingToStock(req, res) {
  const stockRepository = new StockRepository();
  //  We create the stock object and add the purchase transaction to it
  const stock = await stockRepository.createPurchaseStock(req.body, req.user.id);

  res.status(201).json(stock);
}

export const addBuildingToStockController = wrap(addBuildingToStock);
