import {CreateStockParams, StockStatuses, Transaction} from './types';
import {StockRepository} from './models';
import {BuildingRepository} from '../building/models';
import {update} from 'tcomb';

export async function createPurchaseStock(params = {}, operatorId) {
  const buildingRepository = new BuildingRepository();

  await buildingRepository.findByIdOrThrow(params.buildingId);

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

export async function sellPurchasedBuilding(params = {}, operatorId) {
  const buildingRepository = new BuildingRepository();

  await buildingRepository.findByIdOrThrow(params.buildingId);

  const sell = createTransaction(params, operatorId);

  const stockRepository = new StockRepository();

  let stock = await stockRepository.findByBuildingId(params.buildingId);

  if (stock.currentStatus !== StockStatuses.PURCHASE) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.PURCHASE}`);
  }

  return stockRepository.save(update(stock, {$merge: {sell: sell, currentStatus: StockStatuses.SELL}}));
}
