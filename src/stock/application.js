import { StockStatuses, Transaction, TransactionParams } from './types'
import { StockRepository } from './models'
import { BuildingRepository } from '../building/models'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { OperatorRepository } from '../operator/models'
import { SuperSellAward } from '../operator/Awards/SuperSellAward'

export function createTransaction (params = {}, operatorId) {
  return Transaction({
    operatorId: operatorId,
    reservationAmount: params.reservationAmount,
    reservationDate: new Date(params.reservationDate),
    transactionAmount: params.transactionAmount,
    transactionDate: new Date(params.transactionDate)
  })
}

export async function updatePurchaseStock (params = {}, operatorId) {
  const purchase = createTransaction(params, operatorId)

  const stockRepository = new StockRepository()

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId)

  if (stock.currentStatus === StockStatuses.CLOSE) {
    throw new Error(`El stock se encuentra en estado ${StockStatuses.CLOSE}`)
  }

  stock = t.update(stock, {
    purchase: { $set: purchase }
  })

  return stockRepository.save(stock)
}

export async function updateSellStock (params = {}, operatorId) {
  const buildingRepository = new BuildingRepository()

  await buildingRepository.findByIdOrThrow(params.buildingId)

  const sell = createTransaction(params, operatorId)

  const stockRepository = new StockRepository()

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId)
  if (stock.currentStatus === StockStatuses.CLOSE) {
    throw new Error(`El stock se encuentra en estado ${StockStatuses.CLOSE}`)
  }

  stock = t.update(stock, {
    sell: { $set: sell },
    currentStatus: { $set: StockStatuses.SELL }
  })

  return stockRepository.save(stock)
}

export async function cancelSellStock (params) {
  const stockRepository = new StockRepository()

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId)

  if (stock.currentStatus !== StockStatuses.SELL) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.SELL}`)
  }

  stock = t.update(stock, {
    sell: { $set: null },
    currentStatus: { $set: StockStatuses.PURCHASE }
  })

  return stockRepository.save(stock)
}

export async function closeSellStock (params, operatorId) {
  const buildingRepository = new BuildingRepository()

  await buildingRepository.findByIdOrThrow(params.buildingId)

  const stockRepository = new StockRepository()

  const operatorRepository = new OperatorRepository()

  const stock = await stockRepository.findByBuildingIdOrDefault(params.buildingId)

  if (stock.currentStatus !== StockStatuses.SELL) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.SELL}`)
  }
  const operator = await operatorRepository.findByIdOrThrow(operatorId)

  const gain = stock.sell.transactionAmount - stock.purchase.transactionAmount

  if (SuperSellAward.hasSuperSellAward(gain)) {
    await operatorRepository.addAnAward(operator, SuperSellAward.getSuperSellAward())
  }

  const close = {
    operatorId,
    gain: gain,
    transactionDate: new Date()
  }
  const updatedStock = t.update(stock, { close: { $set: close }, currentStatus: { $set: StockStatuses.CLOSE } })
  return stockRepository.save(updatedStock)
}
