import {TransactionParams, StockStatuses, Transaction} from './types';
import {StockFirebaseRepository, StockRepository} from './models';
import {BuildingRepository} from '../building/models';
import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {OperatorRepository} from '../operator/models';
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

  const createStockParams = fromJSON(params, TransactionParams);

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

  const createStockParams = fromJSON(params, TransactionParams);

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

export async function closeSellStock(params, operatorId) {
  const buildingRepository = new BuildingRepository();

  await buildingRepository.findByIdOrThrow(params.buildingId);

  const stockRepository = new StockRepository();

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId);

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
  const operatorsProfits = await stockRepository.listProfitRankings();
  console.log('Operators profits', operatorsProfits);
  if (operatorsProfits.length === 0) {
    return [];
  }

  let operatorsProfitsMap = new Map();
  let operatorsIds = [];

  for (let x = 0; x < operatorsProfits.length; x++) {
    operatorsIds.push(operatorsProfits[x].operatorId);

    const profit = operatorsProfits[x] ? operatorsProfits[x].total : 0;
    operatorsProfitsMap.set(operatorsProfits[x].operatorId, profit);
  }

  const operatorRepository = new OperatorRepository();
  const operators = await operatorRepository.whereIdInArray(operatorsIds);
  console.log('Ids', operatorsIds);

  console.log('Operators ', operators);
  return operators.map((operator, index) => {
    return {
      userId: operator.id,
      userName: operator.username,
      userCity: operator.profile.city,
      goal: operator.profitGoal ? operator.profitGoal.amount : 0,
      currentProfit: operatorsProfitsMap.get(operator.id),
      percentageGoal: operator.profitGoal ? operatorsProfitsMap.get(operator.id) / operator.profitGoal.amount : 0,
      awards: operator.awards,
      rank: index + 1
    };
  });
}
