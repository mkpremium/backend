import {TransactionParams, StockStatuses, Transaction} from './types';
import {StockRepository} from './models';
import {BuildingRepository} from '../building/models';
import t from 'tcomb';

export async function createPurchaseStock(params = {}, operatorId) {
  const buildingRepository = new BuildingRepository();

  const building = await buildingRepository.findByIdOrThrow(params.buildingId);
  console.log("Building ", building);

  const stockRepository = new StockRepository();

  const createStockParams = TransactionParams(params);

  const purchase = createTransaction(params, operatorId);

  const stock = {
    buildingId: createStockParams.buildingId,
    currentStatus: StockStatuses.PURCHASE,
    purchase
  };
  return stockRepository.save(stock);
}

function createTransaction(params = {}, operatorId) {
  params['operatorId'] = operatorId;
  return Transaction(params);
}

export async function sellPurchasedStock(params = {}, operatorId) {
  const buildingRepository = new BuildingRepository();

  await buildingRepository.findByIdOrThrow(params.buildingId);

  const sell = createTransaction(params, operatorId);

  const stockRepository = new StockRepository();

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId);

  if (stock.currentStatus !== StockStatuses.PURCHASE) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.PURCHASE}`);
  }
  const updatedStock = t.update(stock, {sell: {$set: sell}, currentStatus: {$set: StockStatuses.SELL}});
  return stockRepository.save(updatedStock);
}

export async function closeSellStock(buildingId, operatorId) {
  const buildingRepository = new BuildingRepository();

  await buildingRepository.findByIdOrThrow(buildingId);

  const stockRepository = new StockRepository();

  let stock = await stockRepository.findByBuildingIdOrThrow(buildingId);

  if (stock.currentStatus !== StockStatuses.SELL) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.SELL}`);
  }

  let close = {
    operatorId,
    gain: stock.sell.transactionAmount - stock.purchase.transactionAmount,
    transactionDate: new Date()
  };
  const updatedStock = t.update(stock, {close: {$set: close}, currentStatus: {$set: StockStatuses.CLOSE}});
  return stockRepository.save(updatedStock);
}
