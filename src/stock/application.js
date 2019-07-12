import {TransactionParams, StockStatuses, Transaction} from './types';
import {StockFirebaseRepository, StockRepository} from './models';
import {BuildingRepository} from '../building/models';
import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
function createTransaction(params = {}, operatorId) {
  return Transaction({
    operatorId: operatorId,
    reservationAmount: params.reservationAmount,
    reservationDate: new Date(params.reservationDate),
    transactionAmount: params.transactionAmount,
    transactionDate: new Date(params.transactionDate)
  });
}

export async function createPurchaseStock(params = {}, operatorId) {
  const buildingRepository = new BuildingRepository();

  const building = await buildingRepository.findByIdOrThrow(params.buildingId);

  const stockRepository = new StockRepository();

  const createStockParams = fromJSON(params,TransactionParams);

  const purchase = createTransaction(params, operatorId);

  const stock = {
    buildingId: createStockParams.buildingId,
    currentStatus: StockStatuses.PURCHASE,
    purchase
  };

  const stockFirebaseRepository = new StockFirebaseRepository();

  await stockFirebaseRepository.savePurchaseStock(stock);

  return stockRepository.save(stock);
}

export async function sellPurchasedStock(params = {}, operatorId) {
  const buildingRepository = new BuildingRepository();

  await buildingRepository.findByIdOrThrow(params.buildingId);

  const createStockParams = fromJSON(params,TransactionParams);

  const sell = createTransaction(params, operatorId);

  const stockRepository = new StockRepository();

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId);

  if (stock.currentStatus !== StockStatuses.PURCHASE) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.PURCHASE}`);
  }
  const updatedStock = t.update(stock, {sell: {$set: sell}, currentStatus: {$set: StockStatuses.SELL}});

  const stockFirebaseRepository = new StockFirebaseRepository();

  await stockFirebaseRepository.saveSellStock(updatedStock);

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

  const stockFirebaseRepository = new StockFirebaseRepository();

  await stockFirebaseRepository.saveCloseStock(updatedStock);

  return stockRepository.save(updatedStock);
}

export async function getProfitGoalOperatorsRanking() {
  const stockRepository = new StockRepository();
  return stockRepository.listProfitRankings();
}
