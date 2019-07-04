import {CreateStockParams, StockStatuses, Transaction} from './types';
import {StockRepository} from './models';

export async function createPurchaseStock(params = {}, operatorId) {
  const stockRepository = new StockRepository();

  const createStockParams = CreateStockParams(params);

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
