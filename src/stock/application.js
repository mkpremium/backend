import {TransactionParams, StockStatuses, Transaction} from './types';
import {StockFirebaseRepository, StockRepository} from './models';
import {BuildingRepository} from '../building/models';
import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {OperatorRepository} from '../operator/models';
import _ from 'lodash';
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

  const operatorRepository = new OperatorRepository();
  const operator = await operatorRepository.findByIdOrThrow(operatorId);

  const gain = stock.sell.transactionAmount - stock.purchase.transactionAmount;

  // TODO move this to a constant file? or an object value
  if(gain >= 500000){
    await operatorRepository.addAnAward(operator, 'SUPER_SELL');
  }

  let close = {
    operatorId,
    gain: gain,
    transactionDate: new Date()
  };
  const updatedStock = t.update(stock, {close: {$set: close}, currentStatus: {$set: StockStatuses.CLOSE}});

  const stockFirebaseRepository = new StockFirebaseRepository();

  await stockFirebaseRepository.saveCloseStock(updatedStock);

  return stockRepository.save(updatedStock);
}

export async function getProfitGoalOperatorsRanking() {
  const operatorRepository = new OperatorRepository();
  const operators = await operatorRepository.getOperatorsWithProfitGoal();

  const stockRepository = new StockRepository();
  const operatorsProfits = await stockRepository.listProfitRankings();

  let operatorsProfitsMap = new Map();

  for (let x = 0; x < operatorsProfits.length; x++) {
    const profit = operatorsProfits[x] ? operatorsProfits[x].total : 0;
    operatorsProfitsMap.set(operatorsProfits[x].operatorId, profit);
  }

  const unsortedOperatorsRanking = operators.map((operator) => {
    const currentOperatorProfit = operatorsProfitsMap.get(operator.t.id) | 0;
    return {
      userId: operator.t.id,
      userName: operator.t.username,
      userCity: operator.t.profile.city,
      goal: operator.t.profitGoal.amount,
      currentProfit: currentOperatorProfit,
      percentageGoal: currentOperatorProfit / operator.t.profitGoal.amount,
      awards: operator.t.awards,
      rank: 0
    };
  });

  const sortedOperatorsRanking = unsortedOperatorsRanking
    .sort((a, b) => a.percentageGoal < b.percentageGoal);

  return sortedOperatorsRanking.map((operator, index) => {
    operator.rank = index + 1;
    return operator;
  });
}
